import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';
import type { Request, Response, NextFunction } from 'express';
import { getPgPool } from './db';
const scrypt = promisify(scryptCallback);
const COOKIE = 'primetrade_session';
const SESSION_DAYS = 30;
const attempts = new Map<string, { count: number; reset: number }>();
export type AuthUser = { id:string; username:string; email:string; fullName:string; accountBalance:number; demoBalance:number; isKycVerified:boolean; kycTier:string };
declare global { namespace Express { interface Request { authUser?: AuthUser } } }
export async function ensureAuthTables() {
 const pool=getPgPool(); if(!pool) throw new Error('Persistent database is not configured');
 await pool.query(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(100) PRIMARY KEY, username VARCHAR(100) UNIQUE, email VARCHAR(255) UNIQUE, full_name VARCHAR(255), account_balance NUMERIC(15,2) DEFAULT 0.00, demo_balance NUMERIC(15,2) DEFAULT 50000.00, kyc_tier VARCHAR(50) DEFAULT 'Unverified', is_kyc_verified BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)`);
 await pool.query(`CREATE TABLE IF NOT EXISTS investor_auth (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), username VARCHAR(100) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE,
 full_name VARCHAR(255) NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`);
 await pool.query(`CREATE TABLE IF NOT EXISTS investor_sessions (
 token_hash CHAR(64) PRIMARY KEY, user_id UUID NOT NULL REFERENCES investor_auth(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`);
}
const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
async function passwordHash(password:string) { const salt=randomBytes(16).toString('hex'); const key=await scrypt(password,salt,64) as Buffer; return salt+':'+key.toString('hex'); }
async function verifyPassword(password:string,stored:string) { const [salt,keyHex]=stored.split(':'); if(!salt||!keyHex) return false; const actual=await scrypt(password,salt,64) as Buffer; const expected=Buffer.from(keyHex,'hex'); return actual.length===expected.length&&timingSafeEqual(actual,expected); }
function limited(req:Request,res:Response) { const key=req.ip||'unknown'; const now=Date.now(); const old=attempts.get(key); if(old&&old.reset>now&&old.count>=10){res.status(429).json({success:false,message:'Too many attempts. Try again later.'});return true;} attempts.set(key,old&&old.reset>now?{count:old.count+1,reset:old.reset}:{count:1,reset:now+15*60*1000}); return false; }
function setSession(res:Response,token:string) { res.cookie(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_DAYS*86400000}); }
export async function registerInvestor(req:Request,res:Response) {
 if(limited(req,res)) return;
 const {username,email,fullName,password}=req.body||{};
 if(typeof username!=='string'||typeof email!=='string'||typeof fullName!=='string'||typeof password!=='string'||username.trim().length<3||!/^\S+@\S+\.\S+$/.test(email)||fullName.trim().length<2||password.length<10||password.length>200) return res.status(400).json({success:false,message:'Enter valid account details and a password of at least 10 characters.'});
 try { await ensureAuthTables(); const pool=getPgPool()!; const uname=username.trim(); const mail=email.trim().toLowerCase(); const pwh=await passwordHash(password);
 const result=await pool.query('INSERT INTO investor_auth(username,email,full_name,password_hash) VALUES($1,$2,$3,$4) RETURNING id,username,email,full_name',[uname,mail,fullName.trim(),pwh]);
 await pool.query(\`INSERT INTO users(id,username,email,full_name,account_balance,demo_balance,kyc_tier,is_kyc_verified) VALUES($1,$2,$3,$4,0,50000,'Unverified',FALSE) ON CONFLICT (username) DO NOTHING\`,[result.rows[0].id,uname,mail,fullName.trim()]);\n const token=randomBytes(32).toString('base64url'); await pool.query(\`INSERT INTO investor_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')\`,[hashToken(token),result.rows[0].id]); setSession(res,token);
 return res.status(201).json({success:true,user:{...result.rows[0],accountBalance:0,demoBalance:50000,isKycVerified:false,kycTier:'Unverified'}});
 } catch(e:any) { if(e.code==='23505') return res.status(409).json({success:false,message:'Username or email is already registered.'}); console.error('[auth register]',e); return res.status(503).json({success:false,message:'Account service is temporarily unavailable.'}); }
}
export async function loginInvestor(req:Request,res:Response) {
 if(limited(req,res)) return;
 const {identity,password}=req.body||{}; if(typeof identity!=='string'||typeof password!=='string') return res.status(400).json({success:false,message:'Enter your username/email and password.'});
 try { await ensureAuthTables(); const pool=getPgPool()!; const q=await pool.query('SELECT * FROM investor_auth WHERE lower(username)=lower($1) OR lower(email)=lower($1) LIMIT 1',[identity.trim()]);
 if(!q.rows[0]||!(await verifyPassword(password,q.rows[0].password_hash))) return res.status(401).json({success:false,message:'Invalid username/email or password.'});
 const u=q.rows[0]; const token=randomBytes(32).toString('base64url'); await pool.query('INSERT INTO investor_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL \'30 days\')',[hashToken(token),u.id]); setSession(res,token);
 return res.json({success:true,user:{id:u.id,username:u.username,email:u.email,fullName:u.full_name,accountBalance:0,demoBalance:50000,isKycVerified:false,kycTier:'Unverified'}});
 } catch(e) { console.error('[auth login]',e); return res.status(503).json({success:false,message:'Account service is temporarily unavailable.'}); }
}
export async function requireInvestor(req:Request,res:Response,next:NextFunction) {
 try { const token=(req as any).cookies?.[COOKIE]; if(!token) return res.status(401).json({success:false,message:'Authentication required.'}); await ensureAuthTables(); const pool=getPgPool()!;
 const q=await pool.query(`SELECT a.id,a.username,a.email,a.full_name,u.account_balance,u.demo_balance,u.is_kyc_verified,u.kyc_tier FROM investor_sessions s JOIN investor_auth a ON a.id=s.user_id LEFT JOIN users u ON lower(u.username)=lower(a.username) WHERE s.token_hash=$1 AND s.expires_at>NOW()`,[hashToken(token)]);
 if(!q.rows[0]) return res.status(401).json({success:false,message:'Session expired. Please sign in again.'}); const u=q.rows[0]; req.authUser={id:u.id,username:u.username,email:u.email,fullName:u.full_name,accountBalance:Number(u.account_balance||0),demoBalance:Number(u.demo_balance||50000),isKycVerified:!!u.is_kyc_verified,kycTier:u.kyc_tier||'Unverified'}; next();
 } catch(e){console.error('[auth session]',e);res.status(503).json({success:false,message:'Account service is temporarily unavailable.'});}
}
export async function currentInvestor(req:Request,res:Response) { res.json({success:true,user:req.authUser}); }
export async function logoutInvestor(req:Request,res:Response) { const token=(req as any).cookies?.[COOKIE]; if(token){const pool=getPgPool(); if(pool) await pool.query('DELETE FROM investor_sessions WHERE token_hash=$1',[hashToken(token)]).catch(()=>{});} res.clearCookie(COOKIE,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});res.json({success:true}); }
