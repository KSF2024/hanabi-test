import { useEffect, useState, useRef, Fragment } from 'react';
// import testImage from './assets/computer_laptop.png';
// import testImage from './assets/game_icon.png';
// import testImage from './assets/ai_icon.png';
import testImage from './assets/kawahara.png';
import testImage2 from './assets/ai_icon.png';
import { generateStars, Star } from './hanabi';
import { ulid } from "ulidx";

export default function App(){
    /* 状態管理 */
    const [imageSrc, setImageSrc]= useState<string[]>([testImage/* , testImage2 */]);
    const [imageDataObj, setImageDataObj] = useState<{[id: string]: ImageData}>({}); // 読み込む画像データ
    const canvasRef = useRef<HTMLCanvasElement>(null); // アニメーション用Canvas要素の参照

    const starsRef = useRef<{[id: string]: Star[]}>({}); // 花火の星(アニメーション完了後の位置)
    const [starsObj, setStarsObj] = useState<{[id: string]: Star[]}>({}); // 花火の星(アニメーション用)
    const [fireworkSizeObj, setFireworkSizeObj] = useState<{[id: string]: {width: number, height: number}}>({}); // 花火の幅
    const [launchAngle, setLaunchAngle] = useState<number>(0); // 花火の打ち上げ角度 (デフォルト0度)

    const [animationFrameIdObj, setAnimationFrameIdObj] = useState<{[id: string]: number}>({}); // 花火アニメーション用ID
    const isFinishedAnimationObj = useRef<{[id: string]: boolean}>({}); // 花火アニメーションが終了したかどうか

    /* 関数定義 */
    // 画像からImageDataを作成する関数
    
    async function getImageData(image: string): string{
        // canvas要素を作成
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 画像を読み込み、canvasに描画
        const img = new Image();
        const newId: string = ulid();
        img.onload = () => {
            if (!ctx) return;

            // 元の画像の比率を保持したまま横幅を300pxに設定
            const originalWidth = img.width;
            const originalHeight = img.height;
            const newWidth = 300;
            const newHeight = (originalHeight * newWidth) / originalWidth;
            console.log(`${newWidth} × ${newHeight}`);

            // canvasの大きさを新しい大きさに合わせる
            canvas.width = newWidth;
            canvas.height = newHeight;

            // 画像のリサイズと中心点の調整をして描画
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // imageDataの大きさを記録しておく
            const newSize = {[newId]: {width: newWidth, height: newHeight}};
            setFireworkSizeObj(prev => Object.assign(prev, newSize));

            // ImageDataオブジェクトを取得
            const newImageData: ImageData = ctx.getImageData(0, 0, newWidth, newHeight);
            setImageDataObj(prev => Object.assign(prev, {[newId]: newImageData}));
        };
        img.src = image;
    }

    // starデータからキャンバスに点を描画する関数
    function drawStar(ctx: CanvasRenderingContext2D, star: Star) {
        const color: string = `rgba(${[star.color.red, star.color.green, star.color.blue, star.color.alpha / 255]})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    // 画像データを読み込み、花火を爆発させるアニメーションを開始する
    function startAnimation(id: string, imageData: ImageData){
        // 前回の花火打ち上げアニメーションを消去し、初期化する
        if(animationFrameIdObj[id]){
            cancelAnimationFrame(animationFrameIdObj[id]);
            isFinishedAnimationObj.current[id] = true;
        }

        // imageDataから花火の星を作成する
        const newStars: Star[] = generateStars(imageData, launchAngle);
        starsRef.current[id] = newStars;

        // 作成した花火の星を中央に集める
        let initialX: number =  0;
        let initialY: number =  0;
        if(canvasRef.current){
            // 花火を打ち上げる中心点を求める
            initialY = canvasRef.current.height / 2;
            if(Object.keys(imageDataObj).findIndex(value => value === id) === 0){
                initialX = canvasRef.current.width * 0.25;
            }else if(Object.keys(imageDataObj).findIndex(value => value === id) === 1){
                initialX = canvasRef.current.width * 0.75;
            }else{
                initialX = canvasRef.current.width / 2;
            }
        }
        const initializedStars: Star[] = initializeStars(newStars, initialX, initialY);
        console.log({[id]: initializedStars})
        setStarsObj(prev => Object.assign(prev, {[id]: initializedStars}));

        // アニメーションを開始
        const newAnimationFrameId: number = requestAnimationFrame(() => burstFireworks(id, initialX, initialY));
        setAnimationFrameIdObj(prev => Object.assign(prev, {[id]: newAnimationFrameId}));
        isFinishedAnimationObj.current[id] = false;
    }

    // 現状のstarsを再度キャンバスに描画する関数
    function refreshStarsDrawing(id: string){
        if (starsObj[id].length <= 0) return;

        // Canvasコンテキストを取得
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvasをクリア
        // ctx.clearRect(0, 0, canvas.width, canvas.height);

        // スターを描画
        for(const star of starsObj[id]){
            drawStar(ctx, star);
        }
    }

    // 花火を爆発させるアニメーション
    function burstFireworks(id: string, initialX: number, initialY: number){
        if(!starsRef.current[id]) return;
        const renderingStars: Star[] = starsRef.current[id]; // 花火の完成予想図
        const speed: number = 10;

        setStarsObj(prevStars => {
            // 新しいスターの位置を計算して更新
            const updatedStars = prevStars[id].map((star, index) => {
                const renderingStar: Star = renderingStars[index];
                const renderingX: number = renderingStar.x - fireworkSizeObj[id].width / 2 + initialX
                const renderingY: number = renderingStar.y - fireworkSizeObj[id].height / 2 + initialY

                /* ここを改変することで、花火のモーションを変更できる */
                const dx: number = (renderingX - star.x) / speed;
                const dy: number = (renderingY - star.y) / speed;
                const newX: number = star.x + dx;
                const newY: number = star.y + dy;

                return {...star, x: newX, y: newY};
            });

            // 加速度が0に近づいたら、アニメーションを停止する
            isFinishedAnimationObj.current[id] = prevStars[id].every((star, index) => {
                const renderingStar: Star = renderingStars[index];
                const dx: number = (renderingStar.x - star.x + fireworkSizeObj[id].width / 2) / speed;
                const dy: number = (renderingStar.y - star.y + fireworkSizeObj[id].height / 2) / speed;
                return (Math.abs(dx) < 1 && Math.abs(dy) < 1);
            })

            const result = Object.assign(prevStars, {[id]: updatedStars})
            return result;
        });

        if(isFinishedAnimationObj.current[id]){
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setAnimationFrameIdObj(prev => {
                const {removedId: id, ...newAnimationFrameId} = prev;
                return newAnimationFrameId;
            });
            return;
        }else{
            // 次のフレームを要求
            const newAnimationFrameId = requestAnimationFrame(() => burstFireworks(id, initialX, initialY));
            setAnimationFrameIdObj(prev => Object.assign(prev, {[id]: newAnimationFrameId}));
        }
    }

    // 花火が消えていくアニメーション
    function fadeFireworks(id: string){
        if(!starsRef.current[id]) return;
        const speed: number = 10;

        setStarsObj((prevStars) => {
            // 新しい花火の星のの透明度を計算して更新
            const updatedStars = prevStars[id].map((star) => {
                const newAlpha: number = Math.max(Math.round(star.color.alpha - speed), 0); // 透明度が負にならないようにする
                return {...star, color: {...star.color, alpha: newAlpha}};
            });

            isFinishedAnimationObj.current[id] = prevStars[id].every((star) => {
                // 全ての花火の星の透明度が0以下になったらアニメーションを停止
                return star.color.alpha <= 0;
            })

            const result = Object.assign(prevStars, {[id]: updatedStars});
            return result;
        });

        if(isFinishedAnimationObj.current[id]){
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setAnimationFrameIdObj(prev => {
                const {removedId: id, ...newAnimationFrameId} = prev;
                return newAnimationFrameId;
            });
            return;
        }else{
            // 次のフレームを要求
            const newAnimationFrameId: number = requestAnimationFrame(() => fadeFireworks(id));
            setAnimationFrameIdObj(prev => Object.assign(prev, {[id]: newAnimationFrameId}));
        }
    }

    // 花火の星データ(花火が爆発した後)から、アニメーション開始時の花火の星(中央に集合した状態)のデータを取得する関数
    function initializeStars(stars: Star[], initialX: number, initialY: number): Star[]{
        return stars.map((star) => {
            return {...star, x: initialX, y: initialY}
        });
    }

    /* useEffect */
    // fireworksIdをそれぞれ生成し、画像データからimageDataを取得する
    useEffect(() => {
        imageSrc.map(value => getImageData(value));
        return () => {
            setImageDataObj({});
        }
    }, []);

    // 花火IDの用意とimageDataの取得が出来たら、花火の星を作成して、花火アニメーションを開始する
    useEffect(() => {
        console.log({imageDataObj})
        Object.keys(imageDataObj).forEach(id => {
            if(imageDataObj[id]) {
                startAnimation(id, imageDataObj[id]);
            }
        });

        // アンマウント時にアニメーションを停止
        return () => {
            Object.keys(imageDataObj).forEach(id => {
                if(animationFrameIdObj[id]) cancelAnimationFrame(animationFrameIdObj[id]);
                isFinishedAnimationObj.current[id] = true;
            });
        };
    }, [imageDataObj]);

    // starsが変更される度、再度キャンバスに描画する
    useEffect(() => {
        Object.keys(imageDataObj).forEach(id => {
            refreshStarsDrawing(id);
        })
    }, [starsObj]);

    return (
        <>
            <canvas
                id="canvas"
                className="bg-img-transparent"
                ref={canvasRef}
                width={620}
                height={320}
                style={{
                    border: "black 1px solid"
                }}
            />
            <br/>
            {Object.keys(imageDataObj).map(id => (
                <Fragment key={id}>
                    <button
                        onClick={() => {
                            // アニメーションを開始
                            const newAnimationFrameId: number = requestAnimationFrame(() => fadeFireworks(id));
                            setAnimationFrameIdObj(prev => Object.assign(prev, {[id]: newAnimationFrameId}));
                            isFinishedAnimationObj.current[id] = false;
                        }}
                    >花火消滅</button>
                    <button
                        onClick={() => {
                            if(imageDataObj[id]) startAnimation(id, imageDataObj[id]);
                        }}
                    >花火再打ち上げ</button>
                <br/>
                </Fragment>
            ))}
            <label>
                打ち上げ角度: 
                <input 
                    type="number" 
                    value={launchAngle} 
                    onChange={(e) => setLaunchAngle(Number(e.target.value))} 
                    min="0" 
                    max="180" 
                />
            </label>
            <br/>
            <br/>
            <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    // 入力されたファイルを読み込む
                    const files = event.currentTarget.files;
                    if (!files || files?.length === 0) return; // ファイルがなければ終了

                    // 先頭のファイルを取得
                    const file: File = files[0];

                    // FileReaderを使ってファイルを読み込む
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const newImageSrc = e.target?.result;
                        if(typeof newImageSrc === "string"){
                            setImageSrc(prev => {
                                prev[0] = newImageSrc;
                                return prev;
                            });
                            console.log(newImageSrc)
                        }
                    };
                    reader.readAsDataURL(file);  // ファイルをData URLとして読み込む
                }}
            />
            <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    // 入力されたファイルを読み込む
                    const files = event.currentTarget.files;
                    if (!files || files?.length === 0) return; // ファイルがなければ終了

                    // 先頭のファイルを取得
                    const file: File = files[0];

                    // FileReaderを使ってファイルを読み込む
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const newImageSrc = e.target?.result;
                        if(typeof newImageSrc === "string"){
                            setImageSrc(prev => {
                                prev[1] = newImageSrc;
                                return prev;
                            });
                            console.log(newImageSrc)
                        }
                    };
                    reader.readAsDataURL(file);  // ファイルをData URLとして読み込む
                }}
            />
        </>
    );
}
