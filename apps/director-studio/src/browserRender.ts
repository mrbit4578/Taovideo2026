import type { Take } from './mediaStore';
// Render actual local clips; no cloud upload or provider charge. Takes must pass human QC.
export async function renderMovie(takes: Take[], onProgress: (value: string) => void, signal: AbortSignal, aspectRatio = '16:9'): Promise<Blob> {
  if (!takes.length || takes.some(t => !t.approved)) throw new Error('Chọn take và duyệt QC cho mọi cảnh trước khi ghép');
  if (typeof MediaRecorder === 'undefined') throw new Error('Trình duyệt chưa hỗ trợ MediaRecorder; dùng Chrome/Edge hoặc xuất take sang trình dựng phim.');
  const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error('Không có codec WebM trong trình duyệt này');
  const canvas = document.createElement('canvas'); canvas.width = aspectRatio === '9:16' ? 720 : 1280; canvas.height = aspectRatio === '9:16' ? 1280 : 720;
  const ctx = canvas.getContext('2d')!;
  const video = document.createElement('video'); video.playsInline = true; video.preload = 'auto';
  const audio = new AudioContext(); const destination = audio.createMediaStreamDestination(); audio.createMediaElementSource(video).connect(destination);
  await audio.resume();
  const stream = canvas.captureStream(24); destination.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
  const chunks: BlobPart[] = []; recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  let frame = 0, url = '', recording = false, stopping = false;
  const paint = () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); if (video.readyState >= 2) { const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight); const width = video.videoWidth * scale, height = video.videoHeight * scale; ctx.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height); } frame = requestAnimationFrame(paint); };
  const stopped = new Promise<void>((resolve, reject) => { recorder.onstop = () => resolve(); recorder.onerror = () => reject(new Error('Mã hóa video thất bại')); });
  try {
    paint();
    for (let i = 0; i < takes.length; i++) {
      if (signal.aborted) throw new DOMException('Đã hủy dựng phim', 'AbortError');
      onProgress(`Đang dựng cảnh ${i + 1}/${takes.length} · chạy theo thời gian video`);
      if (recording) recorder.pause();
      if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(takes[i].blob);
      await new Promise<void>((resolve, reject) => { const cleanup = () => { video.onloadeddata = null; video.onerror = null; signal.removeEventListener('abort', abort); }; const abort = () => { cleanup(); reject(new DOMException('Đã hủy', 'AbortError')); }; video.onloadeddata = () => { cleanup(); resolve(); }; video.onerror = () => { cleanup(); reject(new Error(`Không giải mã được ${takes[i].name}`)); }; signal.addEventListener('abort', abort, { once: true }); video.src = url; video.load(); });
      if ((takes[i].inPoint || 0) > 0) await new Promise<void>((resolve, reject) => { video.onseeked = () => { video.onseeked = null; resolve(); }; video.onerror = () => reject(new Error('Không seek được clip')); video.currentTime = takes[i].inPoint!; });
      if (recording) recorder.resume(); else { recorder.start(1000); recording = true; }
      await new Promise<void>((resolve, reject) => { let poll = 0; const cleanup = () => { cancelAnimationFrame(poll); video.onended = null; video.onerror = null; signal.removeEventListener('abort', abort); }; const end = () => { video.pause(); cleanup(); resolve(); }; const check = () => { if (takes[i].outPoint != null && video.currentTime >= takes[i].outPoint!) end(); else poll = requestAnimationFrame(check); }; const abort = () => { video.pause(); cleanup(); reject(new DOMException('Đã hủy', 'AbortError')); }; video.onended = end; video.onerror = () => { cleanup(); reject(new Error('Phát video bị lỗi')); }; signal.addEventListener('abort', abort, { once: true }); video.play().then(() => { poll = requestAnimationFrame(check); }).catch(e => { cleanup(); reject(e); }); });
    }
    recorder.stop(); stopping = true; await stopped;
    return new Blob(chunks, { type: mime });
  } finally { if (recording && !stopping && recorder.state !== 'inactive') { recorder.stop(); await stopped.catch(() => {}); } cancelAnimationFrame(frame); video.pause(); video.removeAttribute('src'); video.load(); if (url) URL.revokeObjectURL(url); stream.getTracks().forEach(t => t.stop()); await audio.close(); }
}
