var request = require ('request');
var cheerio = require ('cheerio');

class LinkPreview{
    startDiscover(link,success,err){
        
        if (!(link.indexOf('http') > -1)){
            if(link.includes('www.')){
                link = 'http://' + link;
            }else{
                link = 'http://www.' + link
            }
        }

        if(!this.ValidURL(link)){
            console.log(error);
            return false;
        }

        request(link, function(error,response,html){
            if(!error && response.statusCode == 200){
                var $ = cheerio.load(html);

                let titleTag = $('title').text();
                let titleMeta = $('meta[property="og:title"]').attr('content');
                let title = ( !titleMeta ? titleTag : titleMeta );

                let descriptionMeta = $('meta[property="og:description"]').attr('content');
                let descriptionTag = $('meta[property="description"]').text();
                let descriptionName = $('meta[name="description"]').attr('content');
                let description = '';

                if(descriptionName!='undefined'){
                    description = descriptionName;
                }else{
                   description = ( !descriptionMeta ? descriptionTag : descriptionMeta );
                }

                let img = $('meta[property="og:image"]').attr('content');

                if(img == null){
                    var greatest = null;
                    $('img').each(function(i,element){
                        var myImageElementTemp = {
                            width : element.attribs.width,
                            src : element.attribs.src
                        }

                        if(greatest === null){
                            greatest = myImageElementTemp;
                        }else if(greatest.width <= myImageElementTemp.width){
                            greatest = myImageElementTemp;
                        }
                    });

                    if(greatest != null){
                        img = link + greatest.src;
                    }else{
                        img = 'Do page screenshot';
                    }
                }

                console.log('Image is: ', img);
                
                success({image : img , description : description, title : title, link : link});
                //return ({image : img , description : description, title : title, link : link});

            }
        })


    }

    ValidURL(str) {
        var pattern = new RegExp('([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?([^ ])+');    
        //console.log('Url Validation: ',pattern.test(str));
        return pattern.test(str);
    }
}

module.exports = new LinkPreview();