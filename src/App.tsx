import { useEffect, useState, useRef } from 'react';
import kawaharaLogo from './assets/kawahara.png';
import { generateStars, Star } from './hanabi';

export default function App() {
    /* 状態管理 */
    const [imageData, setImageData] = useState<ImageData | null>(null); // 読み込む画像データ
    const canvasRef = useRef<HTMLCanvasElement>(null); // アニメーション用Canvas要素の参照

    const starsRef = useRef<Star[]>([]); // 花火の星(アニメーション完了後の位置)
    const [stars, setStars] = useState<Star[]>([]); // 花火の星(アニメーション用)
    const [fireworkWidth, setFireworkWidth] = useState<number>(0); // 花火の幅
    const [fireworkHeight, setFireworkHeight] = useState<number>(0); // 花火の高さ

    const [animationFrameId, setAnimationFrameId] = useState<number | null>(null); // 花火アニメーション用ID

    /* 関数定義 */
    // 画像からImageDataを作成する関数
    function getImageData(image: string = kawaharaLogo) {
        // canvas要素を作成
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 画像を読み込み、canvasに描画
        const img = new Image();
        img.onload = () => {
            // canvasの大きさをimageDataに合わせる
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // imageDataの大きさを記録しておく
            setFireworkWidth(img.width);
            setFireworkHeight(img.height);

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
    function animateStars(frameCount: number = 0, maxFrame: number = 300){
        if(!starsRef.current) return;
        const renderingStars: Star[] = starsRef.current; // 花火の完成予想図

        setStars((prevStars) => {
            // 新しいスターの位置を計算して更新
            const updatedStars = prevStars.map((star, index) => {
                // 花火の星の傾きを求める
                const renderingStar: Star = renderingStars[index];

                let newX: number = star.x;
                const dx: number = (renderingStar.x - fireworkWidth / 2) / maxFrame;
                newX += dx;

                let newY: number = star.y;
                const dy: number = (renderingStar.y - fireworkHeight / 2) / maxFrame;
                newY += dy;

                return {...star, x: newX, y: newY};
            });
            return updatedStars;
        });

        // 次のフレームを要求
        console.log({frameCount, maxFrame})
        if(frameCount >= maxFrame){
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
        }else{
            frameCount++;
            setAnimationFrameId(requestAnimationFrame(() => animateStars(frameCount, maxFrame)));
        }
    }

    // 花火の星データ(花火が咲いた後)から、アニメーション開始時の花火の星(中央に集合した状態)のデータを取得する関数
    function initializeStars(stars: Star[], initialX: number, initialY: number): Star[]{
        return stars.map((star) => {
            return {...star, x: initialX, y: initialY}
        });
    }

    /* useEffect */
    // 画像データからimageDataを取得する
    useEffect(() => {
        getImageData();
    }, []);

    // imageDataが取得出来たら、花火の星を作成して、花火アニメーションを開始する
    useEffect(() => {
        if (imageData) {
            // imageDataから花火の星を作成する
            const newStars: Star[] = generateStars(imageData);
            starsRef.current = newStars;

            // 作成した花火の星を中央に集める
            let initialX: number =  0;
            let initialY: number =  0;
            if(canvasRef.current){
                initialX = canvasRef.current.width / 2;
                initialY = canvasRef.current.height / 2;
            }
            const initializedStars: Star[] = initializeStars(newStars, initialX, initialY);
            setStars(initializedStars);

            // アニメーションを開始
            setAnimationFrameId(requestAnimationFrame(animateStars));
        }
        // アンマウント時にアニメーションを停止
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [imageData]);

    // starsが変更される度、再度キャンバスに描画する
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

    return (
        <canvas ref={canvasRef} width={500} height={500}/>
    );
}
