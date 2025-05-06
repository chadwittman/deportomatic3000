# Deport-O-Matic 3000

The world's most *official* government parody tool for tattoo-based deportation decisions. Upload an image, and let our rogue AI decide your fate—with unhinged logic, gang paranoia, and a splash of absurdity.

## 🚨 What It Does

- Accepts user-uploaded images
- Sends the image to Grok Vision (via the GROK API) with a deranged prompt
- Receives a JSON verdict: `deport` or `stay`
- Renders the verdict and commentary onto the image
- Displays the result in a faux-government UI

## 🛠 Requirements

- Node.js
- `@napi-rs/canvas`, `multer`, `express`

## 🌐 How to Run Locally

1. **Clone the Repo**
   ```bash
   git clone https://github.com/yourusername/deport-o-matic
   cd deport-o-matic
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Your API Key**

   Get your [Grok API key](https://x.ai) and create a `.env` file in the root:

   ```env
   GROK_API_KEY=your_api_key_here
   ```

4. **Start the Server**
   ```bash
   node index.js
   ```

5. **Visit**
   ```
   http://localhost:3000
   ```

## 📂 File Structure

- `index.js` – Express server with image upload and Grok integration logic.
- `public/index.html` – Frontend parody portal.
- `uploads/` – Temp storage for uploaded and processed images.

## ⚠️ Legal Disclaimer

This is a **satirical** project. Not affiliated with any government. Use responsibly. Don’t be a fascist.