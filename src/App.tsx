import { useEffect, useState, useRef } from 'react';
import testImage from './assets/computer_laptop.png';
// import testImage from './assets/kawahara.png';
import { generateStars, Star } from './hanabi';

export default function App(){
    /* 状態管理 */
    const [imageData, setImageData] = useState<ImageData | null>(null); // 読み込む画像データ
    const canvasRef = useRef<HTMLCanvasElement>(null); // アニメーション用Canvas要素の参照

    const starsRef = useRef<Star[]>([]); // 花火の星(アニメーション完了後の位置)
    const [stars, setStars] = useState<Star[]>([]); // 花火の星(アニメーション用)
    const [fireworkWidth, setFireworkWidth] = useState<number>(0); // 花火の幅
    const [fireworkHeight, setFireworkHeight] = useState<number>(0); // 花火の高さ

    const [animationFrameId, setAnimationFrameId] = useState<number | null>(null); // 花火アニメーション用ID
    const isFinishedAnimation = useRef<boolean>(true); // 花火アニメーションが終了したかどうか

    /* 関数定義 */
    // 画像からImageDataを作成する関数
    function getImageData(image: string = testImage) {
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
            setImageData(ctx.getImageData(0, 0, img.width, img.height));
        };
        img.src = image;
    }

    // starデータからキャンバスに点を描画する関数
    function drawStar(ctx: CanvasRenderingContext2D, star: Star) {
        let color: string = "rgba(0, 0, 0, 0)";
        if(
            typeof star.color.red === "number" && 
            typeof star.color.green === "number" && 
            typeof star.color.blue === "number" && 
            typeof star.color.alpha === "number"
        ){
            color = `rgba(${star.color.red}, ${star.color.green}, ${star.color.blue}, ${star.color.alpha})`;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 花火を爆発させるアニメーション
    function burstStars(initialX: number, initialY: number){
        if(!starsRef.current) return;
        const renderingStars: Star[] = starsRef.current; // 花火の完成予想図
        const speed: number = 10;

        setStars((prevStars) => {
            // 新しいスターの位置を計算して更新
            const updatedStars = prevStars.map((star, index) => {
                const renderingStar: Star = renderingStars[index];
                const renderingX: number = renderingStar.x - fireworkWidth / 2 + initialX
                const renderingY: number = renderingStar.y - fireworkHeight / 2 + initialY

                /* ここを改変することで、花火のモーションを変更できる */
                const dx: number = (renderingX - star.x) / speed;
                const dy: number = (renderingY - star.y) / speed;
                const newX: number = star.x + dx;
                const newY: number = star.y + dy;

                return {...star, x: newX, y: newY};
            });

            // 加速度が0に近づいたら、アニメーションを停止する
            isFinishedAnimation.current = prevStars.every((star, index) => {
                const renderingStar: Star = renderingStars[index];
                const dx: number = (renderingStar.x - star.x + fireworkWidth / 2) / speed;
                const dy: number = (renderingStar.y - star.y + fireworkHeight / 2) / speed;
                return (Math.abs(dx) < 1 && Math.abs(dy) < 1);
            })

            return updatedStars;
        });

        if(isFinishedAnimation.current){
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setAnimationFrameId(null);
            return;
        }else{
            // 次のフレームを要求
            setAnimationFrameId(requestAnimationFrame(() => burstStars(initialX, initialY)));
        }
    }

    // 花火が消えていくアニメーション
    function fadeFireworks(){
        if(!starsRef.current) return;
        const speed: number = 2;

        setStars((prevStars) => {
            // 新しいスターの透明度を計算して更新
            const updatedStars = prevStars.map((star) => {
                const newAlpha: number = star.color.alpha - 1;
                const fixedNewAlpha: number = (newAlpha > 0) ? newAlpha : 0;
                // if(star.color.alpha > 0) console.log(star.color.alpha)
                return {...star, color: {
                    alpha: fixedNewAlpha,
                    red: star.color.red,
                    green: star.color.green,
                    blue: star.color.blue
                }};
            });

            isFinishedAnimation.current = prevStars.every((star) => {
                const newAlpha: number = star.color.alpha - speed;
                return (newAlpha < 0);
            })

            return updatedStars;
        });

        // console.log(isFinishedAnimation.current)

        if(isFinishedAnimation.current){
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setAnimationFrameId(null);
            return;
        }else{
            // 次のフレームを要求
            setAnimationFrameId(requestAnimationFrame(fadeFireworks));
        }
    }

    // 花火の星データ(花火が爆発した後)から、アニメーション開始時の花火の星(中央に集合した状態)のデータを取得する関数
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
            setAnimationFrameId(requestAnimationFrame(() => burstStars(initialX, initialY)));
            isFinishedAnimation.current = false;
        }
        // アンマウント時にアニメーションを停止
        return () => {
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
            isFinishedAnimation.current = true;
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
        for(const star of stars){
            drawStar(ctx, star);
        }
    }, [stars]);

    return (
        <>
            <canvas
                ref={canvasRef}
                width={500}
                height={500}
                style={{
                    border: "black 1px solid"
                }}
            />
            <button onClick={() => {
                // アニメーションを開始
                setAnimationFrameId(requestAnimationFrame(fadeFireworks));
                isFinishedAnimation.current = false;
            }}>花火消滅</button>
            <button onClick={() => {
                console.log(stars)
            }}>log</button>
        </>
    );
}
