// Browser-side shrinking for uploads, so big files fit the host's request limit and pages stay light.

/** Resize large images (long edge 1800 px) and re-save them as WebP when that is smaller. GIF and SVG are left alone. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < 400_000) {
    bmp.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.86));
  if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
}

const KBPS = [192, 160, 128, 112, 96, 80, 64, 48, 32];
const mins = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Re-encode audio as MP3 at the best quality that fits under maxBytes. Throws a readable message if it cannot fit. */
export async function compressAudio(file: File, maxBytes: number, onProgress?: (done: number) => void): Promise<File> {
  const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC({ sampleRate: 44100 }); // decoding resamples to this rate, which MP3 supports
  let buf: AudioBuffer;
  try {
    buf = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error('This browser could not read that audio file. Try an MP3, M4A or WAV.');
  } finally {
    void ctx.close();
  }
  const budget = maxBytes * 0.97;
  const kbps = KBPS.find((r) => r * 125 * buf.duration <= budget);
  if (!kbps) {
    const fits = Math.floor(budget / (32 * 125));
    throw new Error(`This track is ${mins(buf.duration)} long. Even at the lowest quality only about ${mins(fits)} fits. Trim it first.`);
  }
  const channels = buf.numberOfChannels > 1 && kbps >= 96 ? 2 : 1; // low bitrates sound better in mono
  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const enc = new Mp3Encoder(channels, 44100, kbps);
  const left = buf.getChannelData(0);
  const right = buf.numberOfChannels > 1 ? buf.getChannelData(1) : undefined;
  const i16 = (f: Float32Array) => {
    const o = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) o[i] = Math.max(-1, Math.min(1, f[i])) * 32767;
    return o;
  };
  const parts: Uint8Array[] = [];
  const BLOCK = 1152;
  for (let at = 0, n = 0; at < left.length; at += BLOCK, n++) {
    const l = left.subarray(at, at + BLOCK);
    let out: Uint8Array;
    if (channels === 2 && right) out = enc.encodeBuffer(i16(l), i16(right.subarray(at, at + BLOCK)));
    else if (right) {
      const r = right.subarray(at, at + BLOCK);
      const mix = new Float32Array(l.length);
      for (let i = 0; i < l.length; i++) mix[i] = (l[i] + r[i]) / 2;
      out = enc.encodeBuffer(i16(mix));
    } else out = enc.encodeBuffer(i16(l));
    if (out.length) parts.push(out);
    if (n % 300 === 0) {
      onProgress?.(at / left.length);
      await new Promise((r) => setTimeout(r)); // let the page breathe
    }
  }
  const tail = enc.flush();
  if (tail.length) parts.push(tail);
  const blob = new Blob(parts as BlobPart[], { type: 'audio/mpeg' });
  if (blob.size > maxBytes) throw new Error('The compressed file is still too large. Trim the track first.');
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.mp3', { type: 'audio/mpeg' });
}
