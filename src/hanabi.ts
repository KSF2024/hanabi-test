export type Star = {
    color: {
        red: number
        green: number
        blue: number
        alpha: number
    }
    x: number
    y: number
    radius: number
}

// export function generateStars(imageData: ImageData, angle: number = 0, interval: number = 10, radius: number = 5): Star[]{
    export function generateStars(imageData: ImageData, angle: number = 0, interval: number = 40, radius: number = 10): Star[]{
    const stars: Star[] = [];
    const data = imageData.data;
    const width: number = imageData.width;
    const height: number = imageData.height;

    // 一定の間隔ごとにピクセルの色と座標を取得
    for (let y = 0; y <= height; y += interval) {
        for (let x = 0; x <= width; x += interval) {

            // ピクセルの色情報を取得
            // 画像のピクセルは1次元配列で管理されているため、
            // 4つの要素を1つのピクセルとして扱う
            const index = (y * imageData.width + x) * 4;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const alpha = data[index + 3];

            // 座標を回転させる
            const rotatedPoint = (angle === 0) ? {x, y} : rotatePoint(x, y, width, height, angle);

            stars.push(Object.assign({
                color: { red, green, blue, alpha },
                radius
            }, rotatedPoint));
        }
    }

    return stars;
};

// ボードの横幅と縦幅を指定し、点を指定した角度で回転させる関数
function rotatePoint(x: number, y: number, width: number, height: number, angle: number): {x: number, y: number}{
    // ラジアンに変換
    let radians = angle * (Math.PI / 180);

    // ボードの中心を計算
    let centerX = width / 2;
    let centerY = height / 2;

    // 点を中心に移動
    let translatedX = x - centerX;
    let translatedY = y - centerY;

    // 回転行列を使用して点を回転
    let rotatedX = translatedX * Math.cos(radians) - translatedY * Math.sin(radians);
    let rotatedY = translatedX * Math.sin(radians) + translatedY * Math.cos(radians);

    // 点を元の位置に戻す
    let finalX = rotatedX + centerX;
    let finalY = rotatedY + centerY;

    return { x: finalX, y: finalY };
}
