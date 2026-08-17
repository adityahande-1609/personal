import fs from 'node:fs/promises';
import path from 'node:path';
import { privateFilePath } from './storage.js';
import { prisma } from '../lib/prisma.js';

function esc(value: unknown) { return String(value ?? '').replace(/[\\()]/g, '\\$&').replace(/\r?\n/g, ' '); }
function buildPdf(lines: string[]) {
  let y = 760; const streamLines = ['BT', '/F1 11 Tf'];
  for (const line of lines) { streamLines.push(`1 0 0 1 54 ${y} Tm (${esc(line).slice(0,120)}) Tj`); y -= 18; if (y < 54) break; }
  streamLines.push('ET'); const stream = streamLines.join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf='%PDF-1.4\n'; const offsets=[0]; objects.forEach((obj,i)=>{offsets[i+1]=Buffer.byteLength(pdf);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;}); const xref=Buffer.byteLength(pdf); pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`; for(let i=1;i<=objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`; pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`; return Buffer.from(pdf);
}
export async function generateAgreementPdf(agreementId:string,userId:string){
  const agreement=await prisma.agreement.findFirst({where:{id:agreementId,OR:[{ownerId:userId},{tenantId:userId}]},include:{property:{select:{title:true,areaName:true,city:true,state:true,pincode:true}}}});
  if(!agreement) throw Object.assign(new Error('Agreement not found'),{statusCode:404});
  const lines=['RENTAL AGREEMENT — DRAFT','',`Property: ${agreement.property.title}`,`Location: ${agreement.property.areaName}, ${agreement.property.city}, ${agreement.property.state} ${agreement.property.pincode}`,`Rent: INR ${agreement.rent}`,`Deposit: INR ${agreement.deposit ?? 'Not specified'}`,`Term: ${agreement.startDate.toISOString().slice(0,10)} to ${agreement.endDate.toISOString().slice(0,10)}`,`Rent due day: ${agreement.rentDueDate}`,`Notice period: ${agreement.noticePeriod ?? 'Not specified'}`,`Maintenance: ${agreement.maintenanceResponsibility ?? 'Not specified'}`,`Utilities: ${agreement.utilities ?? 'Not specified'}`,`Pets: ${agreement.pets ?? 'Not specified'}`,`Subletting: ${agreement.subletting ?? 'Not specified'}`,'',`Additional terms: ${agreement.additionalTerms ?? 'None'}`,'','This document is a generated draft based on submitted information.','It does not by itself establish legal execution, registration, stamping, or other formalities.'];
  const key=`agreements/${agreementId}/generated/${Date.now()}-${cryptoRandom()}.pdf`; const target=privateFilePath(key); await fs.mkdir(path.dirname(target),{recursive:true}); await fs.writeFile(target,buildPdf(lines),{flag:'wx'}); await prisma.document.create({data:{userId,agreementId,documentType:'OTHER',storageKey:key,status:'PENDING'}}); return key;
}
function cryptoRandom(){return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}
