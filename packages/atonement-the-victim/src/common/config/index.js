export function getConfig(p = {}) {

    const {config = {}} = p;

    const commonConfig = config.common || {};

    const common = {
        ...commonConfig,
        siteName: "Atonement (The Victim)",
        description: "A new-media-art website for the 3D reproduction of the 'Atonement (The Victim)' painting",
    };

    return {
        config: {
            ...config,
            common: common
        },
    }
}
