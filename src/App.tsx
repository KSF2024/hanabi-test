import { useEffect, useState, useRef, Fragment } from 'react';
// import testImage from './assets/computer_laptop.png';
// import testImage from './assets/game_icon.png';
// import testImage from './assets/ai_icon.png';
import testImage from './assets/kawahara.png';
import testImage2 from './assets/ai_icon.png';
import { generateStars, Star } from './hanabi';
import { ulid } from "ulidx";

type ImageInfo = {
    id: string;
    imageData: ImageData;
    width: number;
    height: number;
}

type Spark = {
    color: string;
    alpha: number;
    x: number;
    y: number;
    radius: number;
    direction: number;
    movementType: 0 | 1 | 2; // 火花の動き(0: 停止, 1: 内丸, 2: 外丸)
    sparkType: 0 | 1 | 2; // 火花の形(0: 丸型, 1: 線型, 2: 雫型)
}

const config = {
    color: "red",
    sparkType: 0,
    widthMagnification: 2
}

export default function App(){
    /* 状態管理 */
    const [imageSrc, setImageSrc]= useState<string[]>((config.widthMagnification > 1)? [testImage, testImage2] : [testImage]);
    const [imageDataObj, setImageDataObj] = useState<{[id: string]: ImageData}>({}); // 読み込む画像データ
    const canvasRef = useRef<HTMLCanvasElement>(null); // アニメーション用Canvas要素の参照

    const starsRef = useRef<{[id: string]: Star[]}>({}); // 花火の星(アニメーション完了後の位置)
    const [starsObj, setStarsObj] = useState<{[id: string]: Star[]}>({}); // 花火の星(アニメーション用)
    const [sparks, setSparksObj] = useState<{[id: string]: Spark[]}>({}); // 花火の火花(アニメーション用)
    const [fireworkSizeObj, setFireworkSizeObj] = useState<{[id: string]: {width: number, height: number}}>({}); // 花火の幅
    const [launchAngle, setLaunchAngle] = useState<number>(0); // 花火の打ち上げ角度 (デフォルト0度)

    const [fireworksAnimationFrameIdObj, setFireworksAnimationFrameIdObj] = useState<{[id: string]: number}>({}); // 花火アニメーション用ID
    const isFinishedFireworksAnimationObj = useRef<{[id: string]: boolean}>({}); // 花火アニメーションが終了したかどうか
    const [sparksAnimationFrameIdObj, setSparksAnimationFrameIdObj] = useState<{[id: string]: number}>({}); // 火花アニメーション用ID
    const isFinishedSparksAnimationObj = useRef<{[id: string]: boolean}>({}); // 火花アニメーションが終了したかどうか


    /* 花火(Star)用関数定義 */
    // 画像からImageDataを作成する関数
    async function getImageData(image: string): Promise<ImageInfo>{
        return new Promise<ImageInfo>((resolve, _rejects) => {
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

                // canvasの大きさを新しい大きさに合わせる
                canvas.width = newWidth;
                canvas.height = newHeight;

                // 画像のリサイズと中心点の調整をして描画
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // ImageDataオブジェクトを取得
                const newImageData: ImageData = ctx.getImageData(0, 0, newWidth, newHeight);
                
                const result: ImageInfo = {
                    id: newId,
                    imageData: newImageData,
                    width: newWidth,
                    height: newHeight
                };
                resolve(result);
            };
            img.src = image;
        });
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

    // 花火を爆発させるアニメーション
    function burstFireworks(id: string, initialX: number, initialY: number){
        // console.log("burstFireworks"+"\n"+id);
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
            isFinishedFireworksAnimationObj.current[id] = prevStars[id].every((star, index) => {
                const renderingStar: Star = renderingStars[index];
                const renderingX: number = renderingStar.x - fireworkSizeObj[id].width / 2 + initialX
                const renderingY: number = renderingStar.y - fireworkSizeObj[id].height / 2 + initialY
                const dx: number = (renderingX - star.x) / speed;
                const dy: number = (renderingY - star.y) / speed;
                return (Math.abs(dx) < 1 && Math.abs(dy) < 1);
            })

            const result = {...prevStars, [id]: updatedStars};
            return result;
        });

        if(isFinishedFireworksAnimationObj.current[id]){
            console.log("animation stopped")
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setFireworksAnimationFrameIdObj(prev => {
                const {removedId: id, ...newAnimationFrameId} = prev;
                return newAnimationFrameId;
            });
            return;
        }else{
            // 次のフレームを要求
            const newAnimationFrameId = requestAnimationFrame(() => burstFireworks(id, initialX, initialY));
            setFireworksAnimationFrameIdObj(prev => ({...prev, [id]: newAnimationFrameId}));
        }
    }

    // 花火の星データ(花火が爆発した後)から、アニメーション開始時の花火の星(中央に集合した状態)のデータを取得する関数
    function initializeStars(stars: Star[], initialX: number, initialY: number): Star[]{
        return stars.map((star) => {
            return {...star, x: initialX, y: initialY}
        });
    }


    /* 花火(Spark)用関数定義 */
    // 火花データを生成する関数
    function generateSparks(sparkType: number, color: string, initialX: number, initialY: number): Spark[]{
        const result: Spark[] = [];

        let direction: number = 0; // 火花の向き
        const amount: number = 30; // 火花の数
        const standardRadius: number = 5; // 火花の大きさ

        // 火花データを生成する
        switch(sparkType){
            case 2: // 雫型
                break;
            case 1: // 線型
                break;
            case 0: // 丸型
            default:
                generateNormalSparks();
        }

        // 丸型の火花を生成する関数
        function generateNormalSparks(){
            for(let i: number = 0; i < amount; i++){
                const newOuterSpark: Spark = {
                    color,
                    alpha: 255,
                    x: initialX,
                    y: initialY,
                    radius: standardRadius * 0.75,
                    direction,
                    movementType: 2,
                    sparkType: sparkType as 0 | 1 | 2
                };
                const newInnerSpark: Spark = {
                    color,
                    alpha: 255,
                    x: initialX,
                    y: initialY,
                    radius: standardRadius,
                    direction,
                    movementType: 1,
                    sparkType: sparkType as 0 | 1 | 2
                };
                result.push(newOuterSpark);
                result.push(newInnerSpark);
            }
        }

        return result;
    }

    // sparkデータからキャンバスに点を描画する関数
    function drawSpark(ctx: CanvasRenderingContext2D, spark: Spark) {
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = spark.alpha / 255;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    // 火花を爆発させるアニメーション
    function burstSparks(id: string, initialX: number, initialY: number){
        const speed: number = 10;
        const outerDifference: number = 0.75// 外火花と内火花の距離の差の倍率
        let isFinishedAnimation: boolean = false; // アニメーションを今回で終わらせるかどうか

        setSparksObj(prevSparks => {
            const newSparks: Spark[] = prevSparks[id].map(spark => {
                // 火花の最終位置を計算する
                const fireworkSize = fireworkSizeObj[id];
                const maxDistance: number = Math.max(fireworkSize.width, fireworkSize.height) + 20;
                const goalDistance: number = maxDistance * ((spark.movementType - 1) ? 1 : outerDifference); // 火花の最終位置から中心点の距離

                // 新しい火花の位置を計算する
                const dx: number = Math.cos(spark.direction) * speed;
                const dy: number = Math.sin(spark.direction) * speed;
                const newX: number = spark.x + dx;
                const newY: number = spark.y + dy;

                // 火花の動きを停止させるかどうかを計算する
                let isStopped: boolean = false;
                const newDistanceX: number = Math.abs(initialX - newX); // 中心点からの横距離
                const newDistanceY: number = Math.abs(initialY - newY); // 中心点からの縦距離
                const newDistance: number = Math.sqrt(Math.pow(newDistanceX, 2) + Math.pow(newDistanceY, 2)); // 中心点からの距離
                if((spark.movementType === 0) || (newDistance > goalDistance)){
                    // 火花が残像扱い(0: 停止)の場合、あるいは火花が目標位置に達した場合、火花を停止させる
                    isStopped = true;

                    // 外側の火花が目標位置に達した場合、アニメーションを終了させる
                    isFinishedAnimation = true;
                }

                const newSpark: Spark = {...spark, x: newX, y: newY};
                const result: Spark = (isStopped) ? {...spark} : newSpark;
                return result;
            });

            return {...prevSparks, [id]: newSparks};
        });

            // 外側の火花が停止したら、アニメーションを停止する
            isFinishedFireworksAnimationObj.current[id] = isFinishedAnimation;

        if(isFinishedSparksAnimationObj.current[id]){
            console.log("sparks animation stopped")
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setSparksAnimationFrameIdObj(prev => {
                const {removedId: id, ...newAnimationFrameId} = prev;
                return newAnimationFrameId;
            });
            return;
        }else{
            // 次のフレームを要求
            const newAnimationFrameId = requestAnimationFrame(() => burstSparks(id, initialX, initialY));
            setSparksAnimationFrameIdObj(prev => ({...prev, [id]: newAnimationFrameId}));
        }
    }

    /* 花火&火花用共通関数定義 */
    // 花火が消えていくアニメーション
    function fadeFireworks(id: string){
        if(!starsRef.current[id]) return;
        const speed: number = 10;

        setStarsObj((prevStars) => {
            // 新しい花火の星の透明度を計算して更新
            const updatedStars = prevStars[id].map((star) => {
                const newAlpha: number = Math.max(Math.round(star.color.alpha - speed), 0); // 透明度が負にならないようにする
                return {...star, color: {...star.color, alpha: newAlpha}};
            });

            isFinishedFireworksAnimationObj.current[id] = prevStars[id].every((star) => {
                // 全ての花火の星の透明度が0以下になったらアニメーションを停止
                return star.color.alpha <= 0;
            })

            const result = {...prevStars, [id]: updatedStars};
            return result;
        });

        if(isFinishedFireworksAnimationObj.current[id]){
            // 花火のアニメーションが終了したら、アニメーションを停止する
            setFireworksAnimationFrameIdObj(prev => {
                const {removedId: id, ...newAnimationFrameId} = prev;
                return newAnimationFrameId;
            });
            return;
        }else{
            // 次のフレームを要求
            const newAnimationFrameId: number = requestAnimationFrame(() => fadeFireworks(id));
            setFireworksAnimationFrameIdObj(prev => ({...prev, [id]: newAnimationFrameId}));
        }
    }

    /* useEffect用関数定義 */
    // 画像データを読み込み、花火を爆発させるアニメーションを開始する
    function startBurstAnimation(id: string, imageData: ImageData){
        // 前回の花火打ち上げアニメーションを消去し、初期化する
        if(fireworksAnimationFrameIdObj[id]){
            cancelAnimationFrame(fireworksAnimationFrameIdObj[id]);
            isFinishedFireworksAnimationObj.current[id] = true;
        }

        // imageDataから花火の星を作成する
        const newStars: Star[] = generateStars(imageData, launchAngle);
        console.log({[id]: newStars})
        starsRef.current[id] = newStars;

        // 花火を打ち上げる中心点を求める
        let initialX: number =  0;
        let initialY: number =  0;
        if(canvasRef.current){
            initialY = canvasRef.current.height / 2;
            initialX = canvasRef.current.width / 2;
            if(Object.keys(imageDataObj).length > 1){
                if(Object.keys(imageDataObj).findIndex(value => value === id) === 0){
                    initialX = canvasRef.current.width * 0.25;
                }else if(Object.keys(imageDataObj).findIndex(value => value === id) === 1){
                    initialX = canvasRef.current.width * 0.75;
                }
            }
        }

        // 花火データを初期化(中心点に集める)し、stateに保存する
        const initializedStars: Star[] = initializeStars(newStars, initialX, initialY);
        setStarsObj(prev => ({ ...prev, [id]: initializedStars }));

        // 火花データを作成し、stateに保存する
        const newSparks: Spark[] = generateSparks(config.sparkType, config.color, initialX, initialY);
        setSparksObj(prev => ({...prev, [id]: newSparks}));

        // 花火アニメーションを開始
        const newFireworksAnimationFrameId: number = requestAnimationFrame(() => burstFireworks(id, initialX, initialY));
        setFireworksAnimationFrameIdObj(prev => ({...prev, [id]: newFireworksAnimationFrameId}));
        isFinishedFireworksAnimationObj.current[id] = false;

        // 火花アニメーションを開始
        const newSparksAnimationFrameId: number = requestAnimationFrame(() => burstSparks(id, initialX, initialY));
        setSparksAnimationFrameIdObj(prev => ({...prev, [id]: newSparksAnimationFrameId}));
        isFinishedSparksAnimationObj.current[id] = false;
    }


    /* useEffect */
    // fireworksIdをそれぞれ生成し、画像データからimageDataを取得する
    useEffect(() => {
        (async () => {
            const importedImageData: ImageInfo[] = await Promise.all(imageSrc.map(async (value) => {
                return await getImageData(value);
            }));
            const newImageDataObj: {[id: string]: ImageData} = {};
            const newFireworkSizeObj: {[id: string]: {width: number, height: number}} = {};
            importedImageData.forEach(data => {
                const {id, imageData, width, height} = data;
                newImageDataObj[id] = imageData;
                newFireworkSizeObj[id] = {width, height};
            });
            setImageDataObj(newImageDataObj);
            setFireworkSizeObj(newFireworkSizeObj);
        })();
        console.log({imageSrc})
        return () => {
            setImageDataObj({});
        }
    }, [imageSrc]);

    // 花火IDの用意とimageDataの取得が出来たら、花火の星を作成して、花火アニメーションを開始する
    useEffect(() => {
        (async () => {
            for(const id of Object.keys(imageDataObj)){
                console.log(id)
                if(imageDataObj[id]){
                    startBurstAnimation(id, imageDataObj[id]);
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
            }
        })();

        // アンマウント時にアニメーションを停止
        return () => {
            Object.keys(imageDataObj).forEach(id => {
                if(fireworksAnimationFrameIdObj[id]) cancelAnimationFrame(fireworksAnimationFrameIdObj[id]);
                isFinishedFireworksAnimationObj.current[id] = true;
            });
        };
    }, [imageDataObj]);

    // starsが変更される度、再度キャンバスに描画する
    useEffect(() => {
        console.log("redraw caused");
        // Canvasコンテキストを取得
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Canvasをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 花火の星を描画
        Object.keys(imageDataObj).forEach(id => {
            if(!starsObj[id]) return;
            for(const star of starsObj[id]){
                drawStar(ctx, star);
            }
        })
    }, [starsObj]);

    return (
        <>
            <canvas
                id="canvas"
                className="bg-img-transparent"
                ref={canvasRef}
                width={300 * config.widthMagnification + 20}
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
                            setFireworksAnimationFrameIdObj(prev => ({...prev, [id]: newAnimationFrameId}));
                            isFinishedFireworksAnimationObj.current[id] = false;
                        }}
                    >花火消滅</button>
                    <button
                        onClick={() => {
                            if(imageDataObj[id]) startBurstAnimation(id, imageDataObj[id]);
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
            {imageSrc.map((_value, index) => (
                <input
                key={index}
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
                                const newImageSrcArray = [...prev];
                                newImageSrcArray[index] = newImageSrc;
                                return newImageSrcArray;
                            });
                            // console.log(newImageSrc)
                        }
                    };
                    reader.readAsDataURL(file);  // ファイルをData URLとして読み込む
                }}
            />
            ))}
        </>
    );
}
