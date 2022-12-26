let parse = require("node-html-parser").parse;
let fs = require("fs");
const { NodeType } = require("node-html-parser");

const rawHtml = fs.readFileSync("cached.html");

let dom = parse(rawHtml.toString());

let output = []

let article = dom.childNodes[1].childNodes[2].childNodes[5];

let dod = false;

article.childNodes.forEach(element => {
    if(dod) return;

    if(element.nodeType == NodeType.ELEMENT_NODE) {
        if(element.rawTagName == "dl") {
            let parameters = [];
            let properties = [];
            let name = "";
            let description = "";
            let foundFunction = false;
            let return_type = "";
            let index = 0;
            let lastDtIndex = 0;

            element.childNodes.forEach(func => {      
                if(func.rawTagName == "dt") {
                    if(foundFunction) {
                        let indexDifference = index - lastDtIndex

                        if(indexDifference == 2 || (indexDifference >= 19 && indexDifference <= 21)) {
                            // special occurances
                            let finished = false;

                            element.childNodes.forEach(func => {
                                if(finished) return;

                                if(func.rawTagName == "dd" &&
                                    // idk but it works
                                    element.childNodes.indexOf(func) >= index
                                ) {
                                    description = func.innerText;
                                    finished = true;
                                }
                            })
                        }

                        output.push({
                            "_type": "function",
                            "name": name,
                            "description": description,
                            "type": return_type,
                            "properties": properties,
                            // "parameters": parameters,
                        });

                        name = "";
                        description = "";
                        parameters = [];
                        properties = [];
                    }
                    
                    func.childNodes.forEach(itm => {
                        if(itm.rawTagName == "span") {
                            if(itm.attrs["class"] == "name") {
                                name = itm.innerText
                            }
                        } else if(itm.nodeType == NodeType.TEXT_NODE) {
                            if(return_type == "") {
                                return_type = itm.innerText;
                            } else {
                                parameters.push(itm.innerText)
                            }
                        }
                        
                        if(itm.parentNode.classList.contains("deprecated") && !properties.includes("deprecated")) {
                            properties.push("deprecated")
                        }
                        if(itm.parentNode.classList.contains("new") && !properties.includes("new")) {
                            properties.push("new")
                        }
                        if(itm.parentNode.classList.contains("updated") && !properties.includes("updated")) {
                            properties.push("updated")
                        }
                    });

                    foundFunction = true;
                    lastDtIndex += 1;
                } else if(func.rawTagName == "dd") {
                    description += func.innerText
                }

                index += 1
            })

            dod = true;
        }
    }
});

fs.writeFileSync("../build/syntax.json", JSON.stringify(output, null, 4))
