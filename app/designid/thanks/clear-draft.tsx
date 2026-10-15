'use client';
import {useEffect} from 'react';
export function ClearDesignIdDraft({email}:{email:string}) {
  useEffect(()=>{try {localStorage.removeItem(`designid-draft-approved-2026-10-15:${email}`);}catch{}},[email]);
  return null;
}
