var bibtexParse = require('bibtex-parser-js');
var _ = require('lodash');
var fs = require('fs');

module.exports = {
    book: {
        assets: './assets',
        css: [
            "style.css"
        ]
    },

    filters: {
        cite: function(key, additionalText) {
            var citation = _.find(this.config.get('bib'), {'citationKey': key.toUpperCase()});
            if (citation !== undefined) {
                if (!citation.used) {
                    citation.used = true;
                    this.config.set('bibCount', this.config.get('bibCount') + 1);
                    citation.number = this.config.get('bibCount');
                }
                var citationText = citation.number;
                if (additionalText) {
                    additionalText = additionalText.replace(/~/g, "&nbsp;");
                    citationText += ", " + additionalText;
                }
                return '<a href="#cite-' + citation.number + '">[' + citationText + ']</a>';
            } else {
                return "[Citation not found]";
            }
        }
    },

    hooks: {
        init: function() {
            var bib = fs.readFileSync('literature.bib', 'utf8');
            this.config.set('bib', bibtexParse.toJSON(bib));
            this.config.set('bibCount', 0);
        }
    },

    blocks: {
        references: {
            process: function(blk) {
                var usedBib = _.filter(this.config.get('bib'), 'used');
                var sortedBib = _.sortBy(usedBib, 'number');

                var result = '<table class="references">';

                sortedBib.forEach(function(item) {
                    result += '<tr><td><span class="citation-number" id="cite-' + item.number + '">' + item.number + '</span></td><td>';
                    var defaultKeys = ['AUTHOR', 'TITLE', 'BOOKTITLE', 'PUBLISHER', 'YEAR'];
                    var keysForTypes = {
                        'ONLINE': {'keys': ['AUTHOR', 'PLAIN_TITLE', 'SUBTITLE', 'NOTE', 'URL'], 'separator': '. '},
                    };

                    var keys = defaultKeys;
                    var separator = ', ';
                    if (item.entryType in keysForTypes) {
                        var obj = keysForTypes[item.entryType];
                        keys = obj.keys;
                        separator = obj.separator;
                    }
                    var values = valuesForKeys(keys, getTagsDictionary(item.entryTags));
                    if (values.length > 0) {
                        result += values.join(separator) + ".";
                    }

                    result += '</td></tr>';
                });

                result += '</table>';

                return result;
            }
        }
    }
};

function valuesForKeys(keys, dict) {
	var values = [];
  keys.forEach(function(key) {
  	if (key in dict) {
    	values.push(dict[key]);
    }
  });
  return values;
}

function getTagsDictionary(entryTags) {
    var tags = entryTags;
    if (entryTags.AUTHOR) {
        tags['AUTHOR'] = formatAuthors(entryTags.AUTHOR);
    }
    if (entryTags.TITLE) {
        tags['TITLE_PLAIN'] = entryTags.TITLE;
        if (entryTags.URL) {
            tags['URL'] = '<a href="' + entryTags.URL + '">' + entryTags.URL + '</a>';
            tags['TITLE'] = '<a href="' + entryTags.URL + '">' + entryTags.TITLE + '</a>';
        } else {
            tags['TITLE'] = entryTags.TITLE;
        }
    }
    if (entryTags.BOOKTITLE) {
        tags['BOOKTITLE_PLAIN'] = entryTags.BOOKTITLE;
        if (entryTags.BOOKURL) {
            tags['BOOKURL'] = '<a href="' + entryTags.BOOKURL + '">' + entryTags.BOOKURL + '</a>';
            tags['BOOKTITLE'] = '<a href="' + entryTags.BOOKURL + '">' + entryTags.BOOKTITLE + '</a>';
        } else {
            tags['BOOKTITLE'] = '<i>' + entryTags.BOOKTITLE + '</i>';
        }
    }
    if (entryTags.PUBLISHER) {
        tags['PUBLISHER'] = '<i>' + entryTags.PUBLISHER + '</i>';
    }
    return tags;
}

function formatAuthors (authorsString) {
    var authors = authorsString.split('and');

    if (authors.length > 3) {
        return authors[0] + ' <i>et al.</i>';
    } else {
        return authorsString;
    }
}
