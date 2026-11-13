import {actor,check,db,FiresideError,handle,FIRESIDE_BUCKET} from '@/lib/fireside/server';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handle(async()=>{
 await actor(true,true);
 if(request.headers.get('origin')!==new URL(request.url).origin)throw new FiresideError('Open the host workspace to upload.',403);
 const limit=4*1024*1024;const reader=request.body?.getReader();if(!reader)throw new FiresideError('Choose a file.');let size=0;const chunks:Uint8Array[]=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit+16384){await reader.cancel();throw new FiresideError('Use direct upload for files larger than 4 MiB.',413);}chunks.push(value);}
 const bytes=Buffer.concat(chunks);const form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();const file=form.get('file');
 if(!(file instanceof File)||!file.size||file.size>limit)throw new FiresideError('Choose a file up to 4 MiB.');
 if(!['video/mp4','audio/mpeg','audio/mp4','audio/wav','application/pdf'].includes(file.type))throw new FiresideError('Choose MP4, MP3, M4A, WAV, or PDF.');
 const name=file.name.slice(0,200).replace(/[^a-zA-Z0-9._-]/g,'_');const path=crypto.randomUUID()+'/'+name;
 check(await db().storage.from(FIRESIDE_BUCKET).upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false}));
 return {storageUrl:'storage://'+FIRESIDE_BUCKET+'/'+path,private:true};
 });}
