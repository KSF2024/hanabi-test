import { useEffect, useState, useRef } from 'react'
import kawaharaLogo from './assets/kawahara.png'
import { generateStars, Star } from './hanabi'

export default function App(){
    const [imageData, setImageData] = useState<ImageData | null>(null)
    const [stars, setStars] = useState<Star[]>([])

    // Canvas要素の参照を作成
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 画像からImageDataを作成する関数
    function getImageData(image: string = kawaharaLogo){
        // canvas要素を作成
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        // 画像を読み込み、canvasに描画
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
    
            // ImageDataオブジェクトを取得
            setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
        };
        img.src = image;
    };

    // starデータからキャンバスに点を描画する関数
    function drawStar(ctx: CanvasRenderingContext2D, star: Star){
        const color: string = `rgba(${star.color.red}, ${star.color.green}, ${star.color.blue}, ${star.color.alpha})`
        ctx.fillStyle = color;
        ctx.beginPath();
        // ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.arc(star.x + 10, star.y + 10, star.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    useEffect(() => {
        getImageData()
    }, [])

    useEffect(() => {
        console.log({imageData})
        if(imageData){
            const newStars: Star[] = generateStars(imageData, 1, 1)
            setStars(newStars)
        }
    }, [imageData])

    useEffect(() => {
        console.log({stars})
        if(stars.length <= 0) return

        // Canvasコンテキストを取得
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        for(const star of stars){
            drawStar(ctx, star)
        }
    }, [stars])

    return (
        <>
            <canvas ref={canvasRef} width={400} height={400} />
        </>
    )
}
