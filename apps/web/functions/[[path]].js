const API_URL = "https://wa-market-api.khibrohstudio.workers.dev/api";
const PLATFORM_DOMAINS = ['wa-market-web.pages.dev', 'wa-market.com', 'warung.my.id', 'localhost'];

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // Process response from static assets
    const response = await env.ASSETS.fetch(request);
    
    // Only modify HTML files (avoid processing static assets like images, js, css)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
        return response;
    }
    
    // Check if domain is a custom domain or a platform domain
    let isPlatformDomain = false;
    for (const pd of PLATFORM_DOMAINS) {
        if (hostname === pd || hostname.endsWith(`.${pd}`)) {
            isPlatformDomain = true;
            break;
        }
    }
    
    let storeSlug = null;
    let storeInfo = null;
    let productInfo = null;
    let isProductPage = false;
    let productId = null;

    try {
        if (isPlatformDomain) {
            // Platform URL structure: /s/:slug
            const matchStore = url.pathname.match(/^\/s\/([^/]+)/);
            if (matchStore) {
                storeSlug = matchStore[1];
                
                // Check if it's a product page: /s/:slug/product/:id
                const matchProduct = url.pathname.match(/^\/s\/[^/]+\/product\/([^/]+)/);
                if (matchProduct) {
                    isProductPage = true;
                    productId = matchProduct[1];
                }
            } else {
                // Main landing page of platform - don't modify
                return response;
            }
        } else {
            // Custom Domain
            // First resolve the custom domain to get the slug
            const resolveResp = await fetch(`${API_URL}/resolver/domain/${hostname}`);
            if (resolveResp.ok) {
                const resolveData = await resolveResp.json();
                if (resolveData.found && resolveData.isActive) {
                    storeSlug = resolveData.slug;
                    storeInfo = { name: resolveData.name };
                } else {
                    return response; // Not active or not found
                }
            } else {
                return response;
            }

            // Check if it's a product page on custom domain: /product/:id
            const matchProduct = url.pathname.match(/^\/product\/([^/]+)/);
            if (matchProduct) {
                isProductPage = true;
                productId = matchProduct[1];
            }
        }

        // Fetch store settings if we have a slug
        if (storeSlug) {
            const settingsResp = await fetch(`${API_URL}/s/${storeSlug}/settings`);
            if (settingsResp.ok) {
                const settingsData = await settingsResp.json();
                if (!storeInfo) storeInfo = {};
                storeInfo.tagline = settingsData.store_tagline || "";
                storeInfo.description = settingsData.store_description || "";
                storeInfo.logo = settingsData.logo_url || "";
                storeInfo.name = settingsData.store_name || storeInfo.name || storeSlug;
            }
        }

        // Fetch product info if it's a product page
        if (isProductPage && productId && storeSlug) {
            const productResp = await fetch(`${API_URL}/s/${storeSlug}/products/${productId}`);
            if (productResp.ok) {
                const pData = await productResp.json();
                // Extract first image if array
                let img = null;
                if (pData.images) {
                    try {
                        const parsed = typeof pData.images === 'string' ? JSON.parse(pData.images) : pData.images;
                        let firstImg = Array.isArray(parsed) ? parsed[0] : parsed;
                        img = (typeof firstImg === 'object' && firstImg !== null) ? firstImg.url : firstImg;
                    } catch (e) {
                        img = typeof pData.images === 'string' ? pData.images : null; // fallback
                    }
                }
                if (!img && pData.image) {
                    img = pData.image;
                }
                productInfo = {
                    name: pData.name,
                    description: pData.description || "",
                    price: pData.price,
                    image: img
                };
            }
        }
    } catch (error) {
        console.error("Meta injection error:", error);
        // Fallback to unmodified response if API fails
        return response;
    }

    // Now inject meta tags using HTMLRewriter
    if (storeInfo) {
        let metaTitle = storeInfo.name;
        let metaDesc = storeInfo.description || storeInfo.tagline || `Selamat datang di toko ${storeInfo.name}`;
        let metaImage = storeInfo.logo;

        if (productInfo) {
            metaTitle = `${productInfo.name} - ${storeInfo.name}`;
            metaDesc = `Rp ${Number(productInfo.price).toLocaleString('id-ID')} | ${productInfo.description.substring(0, 150)}...`;
            metaImage = productInfo.image || metaImage;
        }

        // HTML encode values just in case
        const escapeHtml = (unsafe) => {
            if (!unsafe) return "";
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        }

        metaTitle = escapeHtml(metaTitle);
        metaDesc = escapeHtml(metaDesc.replace(/(<([^>]+)>)/gi, "")); // remove HTML tags from description if any

        // Ensure absolute URL for image
        let imageUrl = metaImage;
        if (typeof imageUrl === 'object' && imageUrl !== null) {
            imageUrl = imageUrl.url || imageUrl.src || '';
        }
        if (typeof imageUrl === 'string') {
            if (imageUrl && !imageUrl.startsWith('http')) {
                if (imageUrl.startsWith('/uploads')) {
                    imageUrl = `https://wa-market-api.khibrohstudio.workers.dev${imageUrl}`;
                } else {
                    imageUrl = `https://wa-market-api.khibrohstudio.workers.dev/uploads/${imageUrl}`;
                }
            }
        }
        if (!imageUrl) {
            // Optional fallback
            imageUrl = 'https://wa-market-api.khibrohstudio.workers.dev/uploads/default-image.png'; 
        }

        return new HTMLRewriter()
            .on("head", new MetaInjector(metaTitle, metaDesc, imageUrl, url.href))
            .on("title", new TitleReplacer(metaTitle))
            .transform(response);
    }

    return response;
}

class MetaInjector {
    constructor(title, description, image, url) {
        this.title = title;
        this.description = description;
        this.image = image;
        this.url = url;
    }

    element(element) {
        element.append(`<meta name="description" content="${this.description}" />`, { html: true });
        
        element.append(`<meta property="og:title" content="${this.title}" />`, { html: true });
        element.append(`<meta property="og:description" content="${this.description}" />`, { html: true });
        if (this.image && this.image !== 'https://wa-market-api.khibrohstudio.workers.dev/uploads/default-image.png') {
            element.append(`<meta property="og:image" content="${this.image}" />`, { html: true });
        }
        element.append(`<meta property="og:url" content="${this.url}" />`, { html: true });
        element.append(`<meta property="og:type" content="website" />`, { html: true });
        
        // Twitter cards
        element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        element.append(`<meta name="twitter:title" content="${this.title}" />`, { html: true });
        element.append(`<meta name="twitter:description" content="${this.description}" />`, { html: true });
        if (this.image && this.image !== 'https://wa-market-api.khibrohstudio.workers.dev/uploads/default-image.png') {
            element.append(`<meta name="twitter:image" content="${this.image}" />`, { html: true });
        }
    }
}

class TitleReplacer {
    constructor(title) {
        this.title = title;
    }
    element(element) {
        element.setInnerContent(this.title, { html: false });
    }
}
