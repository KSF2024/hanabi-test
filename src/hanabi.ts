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

export function generateStars(imageData: ImageData, interval: number, radius: number): Star[]{
    const stars: Star[] = [];
    const data = imageData.data;

    // 一定の間隔ごとにピクセルの色と座標を取得
    for (let y = 0; y <= imageData.height; y += interval) {
        for (let x = 0; x <= imageData.width; x += interval) {

            // ピクセルの色情報を取得
            // 画像のピクセルは1次元配列で管理されているため、
            // 4つの要素を1つのピクセルとして扱う
            const index = (y * imageData.width + x) * 4;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const alpha = data[index + 3];

            stars.push({
                color: { red, green, blue, alpha },
                x,
                y,
                radius,
            });
        }
    }

    return stars;
};
