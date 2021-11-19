const storageName = "atonement-the-victim";

export function storage(newData = {}) {
    if (typeof window !== "undefined") {
        try {
            const currentData = JSON.parse(window.localStorage.getItem(storageName) || JSON.stringify({}));
            const tempCurrentDataString = JSON.stringify(currentData);
            Object.keys(newData).forEach(function (key){
                currentData[key] = newData[key];
            });
            if (tempCurrentDataString !== JSON.stringify(currentData)) {
                window.localStorage.setItem(storageName, JSON.stringify(currentData));
            }
            return currentData;
        } catch (e){
            return newData;
        }
    }
    return {};
}
