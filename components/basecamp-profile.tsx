'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { emptyProfile, type BaseCampProfile } from '@/lib/profile/types';
import styles from './basecamp-profile.module.css';

async function preparePhoto(file: File): Promise<Blob> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw Error('Choose a JPEG, PNG or WebP photo.');
  if (file.size > 12 * 1024 * 1024) throw Error('Choose a photo smaller than 12 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Your browser could not prepare this photo. Try another browser.');
    const edge = Math.min(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, (bitmap.width - edge) / 2, (bitmap.height - edge) / 2, edge, edge, 0, 0, 512, 512);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('This photo could not be prepared. Try another one.')), 'image/jpeg', 0.88));
  } finally { bitmap.close(); }
}

export function BaseCampProfile({ initialName, preview = false }: { initialName: string; preview?: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useState<BaseCampProfile>({ ...emptyProfile, display_name: initialName });
  const [draft, setDraft] = useState(profile);
  const [loading, setLoading] = useState(!preview);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const chooser = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  useEffect(() => {
    if (!photo) { setPhotoUrl(''); return; }
    const url = URL.createObjectURL(photo); setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    fetch('/api/profile', { cache: 'no-store', signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); return body.profile as BaseCampProfile; })
      .then(value => { const loaded = { ...value, display_name: value.display_name || initialName }; setProfile(loaded); setDraft(loaded); })
      .catch(err => { if (err.name !== 'AbortError') { setError(err.message || 'Your profile could not be loaded.'); setLoadFailed(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [preview, initialName]);
  async function choosePhoto(file?: File) {
    if (!file) return;
    const requestId = ++photoRequest.current;
    setPreparing(true); setError('');
    try { const blob = await preparePhoto(file); if (requestId === photoRequest.current) { setPhoto(blob); setRemovePhoto(false); } }
    catch (err) { if (requestId === photoRequest.current) setError(err instanceof Error ? err.message : 'Choose another photo.'); }
    finally { if (requestId === photoRequest.current) setPreparing(false); if (chooser.current) chooser.current.value = ''; }
  }
  function cancel() { photoRequest.current++; setPreparing(false); setEditing(false); setDraft(profile); setPhoto(null); setRemovePhoto(false); setError(''); }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      if (preview) {
        setMessage('This is a preview account. Sign in to save your own profile.');
        return;
      }
      const form = new FormData();
      form.set('profile', JSON.stringify({ ...draft, remove_photo: removePhoto }));
      if (photo) form.set('photo', photo, 'profile.jpg');
      const response = await fetch('/api/profile', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'Your profile could not be saved.');
      setProfile(body.profile); setDraft(body.profile); setPhoto(null); setRemovePhoto(false); setEditing(false); setMessage('Your profile is saved.'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Your profile could not be saved. Please try again.'); }
    finally { setSaving(false); }
  }
  const shown = editing ? draft : profile;
  const image = editing && photoUrl ? photoUrl : shown.has_photo && !(editing && removePhoto) ? `/api/profile/photo?v=${profile.revision}` : '';
  const initials = (shown.display_name || initialName).split(/\s+/).filter(Boolean).slice(0,2).map(word => word[0]).join('').toUpperCase();
  return <section className={styles.panel} aria-label="Your Base Camp profile" id="your-profile">
    <div className={styles.heading}><div><p className="section-label">Your profile</p><h2>A little about you.</h2><p>An introduction for the people walking alongside you.</p></div>{!editing && !loading && !loadFailed && <button className="button secondary" onClick={() => { setDraft(profile); setEditing(true); setMessage(''); }}> {profile.revision ? 'Edit profile' : 'Set up profile'}</button>}</div>
    {loading ? <div className={styles.skeleton} aria-label="Loading your profile" /> : <>
      <div className={styles.introduction}>
        <div className={styles.avatar}>{image ? <img src={image} alt={`${shown.display_name || initialName}'s profile`} /> : <span aria-label="Your initials">{initials}</span>}</div>
        <div className={styles.summary}><h3>{shown.display_name || initialName}</h3><p>{shown.bio || 'Your story, in a few words. Add a short bio and a few things you enjoy.'}</p>{shown.fun_facts.filter(Boolean).length > 0 && <ul className={styles.facts}>{shown.fun_facts.filter(Boolean).map((fact,i) => <li key={i}>{fact}</li>)}</ul>}</div>
      </div>
      {preview && <p className={styles.note}>Preview account. Sign in to save your own profile.</p>}
      {editing && <form onSubmit={save} className={styles.form}>
        <fieldset disabled={saving} className={styles.fields}>
          <div className={styles.photoControls}><label className="button secondary" htmlFor="profile-photo">{preparing ? 'Preparing photo…' : 'Choose photo'}</label><input ref={chooser} id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={preparing || saving} onChange={e => void choosePhoto(e.target.files?.[0])} />{(profile.has_photo || photo) && <button type="button" className="button secondary" onClick={() => { photoRequest.current++; setPreparing(false); setPhoto(null); setRemovePhoto(true); }}>Remove photo</button>}<p>JPEG, PNG or WebP, up to 12 MB. We center-crop and resize it to a square before uploading.</p></div>
          <label>Display name<input name="display_name" required maxLength={80} value={draft.display_name} onChange={e => setDraft({ ...draft, display_name: e.target.value })} autoComplete="nickname" /></label>
          <label>Short bio <span className={styles.optional}>(optional)</span><textarea name="bio" rows={3} maxLength={600} value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} /><small>{draft.bio.length}/600 characters</small></label>
          <div className={styles.funFacts}><p>A few fun things <span className={styles.optional}>(optional)</span></p>{[0,1,2].map(i => <label key={i}>Fun fact {i+1}<input name={`fun_fact_${i+1}`} maxLength={120} placeholder={['Something you enjoy','A favorite place or pastime','Something people might not guess'][i]} value={draft.fun_facts[i] || ''} onChange={e => { const facts = [...draft.fun_facts]; while (facts.length < 3) facts.push(''); facts[i] = e.target.value; setDraft({ ...draft, fun_facts: facts }); }} /></label>)}</div>
        </fieldset>
        <p className={styles.note}>This profile is private to your account for now. It does not share your email, assessment results or personal reflections. Circle sharing will be added separately.</p>
        <div className={styles.actions}><button className="button primary" disabled={saving || preparing || !draft.display_name.trim()}>{saving ? 'Saving…' : 'Save profile'}</button><button className="button secondary" type="button" disabled={saving} onClick={cancel}>Cancel</button></div>
      </form>}
    </>}
    {error && <p className={styles.error} role="alert">{error}{loadFailed && <> <button className="button secondary" onClick={() => window.location.reload()}>Reload profile</button></>}</p>}
    <p role="status" aria-live="polite" className={styles.success}>{message}</p>
  </section>;
}
