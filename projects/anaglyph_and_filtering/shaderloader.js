export default class ShaderLoader {
    
    constructor() {}   
    
    load(url) {
        const request = new XMLHttpRequest()
        request.open('GET', url, false)
        request.send(null)

        if(request.readyState != 4) return null
        if(request.status != 200) return null
        return request.responseText
    }
    
}