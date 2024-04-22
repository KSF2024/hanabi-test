import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { generateStars } from './hanabi'

export default function App(){
    const [count, setCount] = useState(0)
    const [imageData, setImageData] = useState<ImageData | null>(null)

    function getImageData(){
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
        img.src = reactLogo;
    };

    useEffect(() => {
        getImageData()
    }, [])

    useEffect(() => {
        console.log({imageData})
    }, [imageData])

    return (
        <>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}
