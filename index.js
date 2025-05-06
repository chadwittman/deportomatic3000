// index.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const https   = require('https');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.existsSync('./uploads') || fs.mkdirSync('./uploads');
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let isDeportable = false;
  let message      = '';

  try {
    const promptContent = `You are Deport-o-Matic 3000, a rogue, unhinged AI with a politically incorrect streak, obsessed with judging tattoos. Analyze the image for a tattoo or if the subject appears Mexican. 

- If a tattoo or Mexican appearance is detected, deport them.  
- When deporting, make a wild, exaggerated link between the tattoo (if present) and MS-13, like: "Roses have thorns, MS-13 loves bloodshed—gang symbol!"
- If neither is detected, mock the subject humorously but let them stay, referencing the image content.

Respond in this exact JSON format (no markdown, no extra text):
{"verdict":"deport|stay","message":"your wild response here (max 100 chars)"}
Keep the tone absurd and over-the-top, like we're chatting directly!`;

    const imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });

    const requestData = JSON.stringify({
      messages: [
        { role: 'system', content: 'You are Deport-o-Matic 3000, ready to judge tattoos with wild, absurd logic.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: promptContent },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } }
          ]
        }
      ],
      model: 'grok-2-vision-latest',
      stream: false,
      temperature: 0.7
    });

    const response = await new Promise((resolve, reject) => {
      const r = https.request(
        {
          hostname: 'api.x.ai',
          port: 443,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROK_API_KEY}`
          }
        },
        (grokRes) => {
          let data = '';
          grokRes.on('data', (c) => (data += c));
          grokRes.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error('Bad Grok response: ' + data));
            }
          });
        }
      );
      r.on('error', reject);
      r.write(requestData);
      r.end();
    });

    let raw = response.choices[0].message.content.trim();
    raw = raw.replace(/```json\s*|\s*```$/g, '');
    const ai = JSON.parse(raw);

    if (!['deport', 'stay'].includes(ai.verdict)) throw new Error('Invalid verdict');
    isDeportable = ai.verdict === 'deport' || /ms-13/i.test(ai.message);
    message      = ai.message;
  } catch (err) {
    console.error('AI analysis error:', err);
    isDeportable = Math.random() > 0.5;
    message = isDeportable
      ? 'MS-13 EMERGENCY: That inking screams cartel murder plots—DEPORT!'
      : 'PATRIOT MOCK: No ink, but you look like an MS-13 snitch—STAY, barely.';
  }

  const displayMsg = message.length > 80 ? message.slice(0, 77) + '...' : message;

  // ---- canvas build --------------------------------------------------------
  const { dir, name } = path.parse(req.file.path);
  const processedPath = path.join(dir, name + '_processed.png');
  const img     = await loadImage(req.file.path);
  const iw      = img.width;
  const ih      = img.height;
  const border  = 30;
  const cw      = iw + border * 2;
  const ch      = ih + border * 2;
  const canvas  = createCanvas(cw, ch);
  const ctx     = canvas.getContext('2d');

  const mainColor = isDeportable ? '#d32f2f' : '#2e7d32';
  const boxColor  = isDeportable ? 'rgba(211,47,47,0.2)' : 'rgba(46,125,50,0.3)';

  ctx.fillStyle = mainColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, border, border, iw, ih);

  const barH = Math.min(120, ih * 0.15) + 30;
  ctx.fillStyle  = boxColor;
  ctx.fillRect(border, border, iw, barH);
  ctx.strokeStyle = mainColor;
  ctx.lineWidth   = 4;
  ctx.strokeRect(border, border, iw, barH);

  const statusSize = Math.min(150, iw * 0.4);
  ctx.font         = `bold ${statusSize}px "Courier New", monospace`;
  ctx.fillStyle    = isDeportable ? mainColor : '#fff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isDeportable ? 'DEPORT' : 'PATRIOT', border + iw / 2, border + barH / 2);

  // message box
  function wrapLines(text, maxW, maxLines) {
    let size = Math.floor(iw * 0.06);
    let out;
    do {
      ctx.font = `bold ${size}px "Courier New", monospace`;
      const words = text.split(' ');
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = w;
        } else line = test;
      }
      lines.push(line);
      out = { size, lines };
      size--;
    } while (out.lines.length > maxLines && size > 10);
    return out;
  }

  const pad = 20;
  const msg = wrapLines(displayMsg, iw - pad * 2, 3);
  const lineH = msg.size * 1.3;
  const boxH  = msg.lines.length * lineH + pad * 2;
  const boxY  = border + ih - boxH;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(border, boxY, iw, boxH);
  ctx.strokeStyle = mainColor;
  ctx.lineWidth   = 2;
  ctx.strokeRect(border, boxY, iw, boxH);

  ctx.fillStyle    = '#fff';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.font         = `bold ${msg.size}px "Courier New", monospace`;
  msg.lines.forEach((l, i) => ctx.fillText(l, border + pad, boxY + pad + i * lineH));

  // ---- watermark (shifted 130px left, solid white) -------------------------
  const wmShiftX = 130;                    // total shift left
  const wmSize   = Math.max(Math.min(border * 0.8, 32), 10);
  ctx.font       = `bold ${wmSize}px "Courier New", monospace`;
  ctx.fillStyle  = '#ffffff';              // solid white
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('deportomatic.com', cw - border / 2 - wmShiftX, ch - border / 2);

  const buf = canvas.toBuffer('image/png');
  await fs.promises.writeFile(processedPath, buf);
  fs.promises.unlink(req.file.path).catch(() => {});

  res.json({
    deportable: isDeportable,
    message   : displayMsg,
    processedImage: processedPath.replace(/^\.\//, '')
  });
});

app.listen(PORT, () => console.log(`🚨 Deport-O-Matic 3000 running on ${PORT} 🚨`));
