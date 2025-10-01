export function generateUsername(base = 'user'){
    const rand = Math.floor(Math.random() * 10000)
    return `${base}-${rand}`
}
