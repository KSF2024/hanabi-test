import { useEffect, useState, useRef } from 'react';
import kawaharaLogo from './assets/kawahara.png';
import { generateStars, Star } from './hanabi';

export default function App() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  // Canvas要素の参照を作成
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 画像からImageDataを作成する関数
  function getImageData(image: string = kawaharaLogo) {
    // canvas要素を作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 画像を読み込み、canvasに描画
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; // Canvasの幅を画像の幅に設定
      canvas.height = img.height; // Canvasの高さを画像の高さに設定
      ctx.drawImage(img, 0, 0);

      // ImageDataオブジェクトを取得
      setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.src = image;
  }

  // starデータからキャンバスに点を描画する関数
  function drawStar(ctx: CanvasRenderingContext2D, star: Star) {
    const color: string = `rgba(${star.color.red}, ${star.color.green}, ${star.color.blue}, ${star.color.alpha})`;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // アニメーションのフレーム毎の処理
  function animateStars() {
    setStars((prevStars) => {
      // 新しいスターの位置を計算して更新
      const updatedStars = prevStars.map((star) => {
        const dx = imageData!.width / 2 - star.x; // X方向の移動距離
        const dy = imageData!.height / 2 - star.y; // Y方向の移動距離
        const distance = Math.sqrt(dx * dx + dy * dy); // 中心からの距離
        const speed = Math.min(0.05 * distance, 10); // 移動速度を制限
        const angle = Math.atan2(dy, dx); // 移動方向の角度
        const newX = star.x + Math.cos(angle) * speed; // 新しいX座標
        const newY = star.y + Math.sin(angle) * speed; // 新しいY座標
        return { ...star, x: newX, y: newY };
      });
      return updatedStars;
    });

    // 次のフレームを要求
    setAnimationFrameId(requestAnimationFrame(animateStars));
  }

  useEffect(() => {
    getImageData();
  }, []);

  useEffect(() => {
    if (imageData) {
      const newStars: Star[] = generateStars(imageData, 10, 5);
      setStars(newStars);
      // アニメーションを開始
      setAnimationFrameId(requestAnimationFrame(animateStars));
    }
    // アンマウント時にアニメーションを停止
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [imageData]);

  useEffect(() => {
    if (stars.length <= 0) return;

    // Canvasコンテキストを取得
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvasをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // スターを描画
    for (const star of stars) {
      drawStar(ctx, star);
    }
  }, [stars]);

  return <canvas ref={canvasRef} />;
}
