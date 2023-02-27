var bibtexParse = require("bibtex-parser-js");
var _ = require("lodash");
var fs = require("fs");

module.exports = {
  book: {
    assets: "./assets",
    css: ["style.css"],
  },

  filters: {
    cite: function (key, additionalText) {
      var citation = _.find(this.config.get("bib"), {
        citationKey: key.toUpperCase(),
      });
      if (citation !== undefined) {
        if (!citation.used) {
          citation.used = true;
          this.config.set("bibCount", this.config.get("bibCount") + 1);
          citation.number = this.config.get("bibCount");
        }
        var citationText = citation.number;
        if (additionalText) {
          additionalText = additionalText.replace(/~/g, "&nbsp;");
          citationText += ", " + additionalText;
        }
        return (
          '<sup><a href="#cite-' +
          citation.number +
          '">[' +
          citationText +
          "]</a></sup>"
        );
      } else {
        return "[Citation not found]";
      }
    },
  },

  hooks: {
    init: function () {
      var filepath = this.resolve("literature.bib");
      var bib = fs.readFileSync(filepath, "utf8");
      this.config.set("bib", bibtexParse.toJSON(bib));
      this.config.set("bibCount", 0);
    },
  },

  blocks: {
    references: {
      process: function (_blk) {
        var usedBib = _.filter(this.config.get("bib"), "used");
        var sortedBib = _.sortBy(usedBib, "number");

        var result = "<div>";

        sortedBib.forEach(function (item) {
          result +=
            '<blockquote id="cite-' + item.number + '">' + item.number + " ";
          var defaultKeys = [
            "AUTHOR",
            "TITLE",
            "BOOKTITLE",
            "PUBLISHER",
            "YEAR",
            "NOTE",
            "URL",
          ];
          var keysForTypes = {
            ARTICLE: {
              keys: [
                "AUTHOR",
                "YEAR",
                "TITLE",
                "JOURNAL",
                "VOLUME",
                "DOI",
                "URL",
              ],
              separator: ". ",
            },
            BOOK: {
              keys: [
                "AUTHOR",
                "YEAR",
                "TITLE",
                "BOOKTITLE",
                "JOURNAL",
                "VOLUME",
                "DOI",
                "URL",
                "PUBLISHER",
              ],
              separator: ". ",
            },
          };

          var keys = defaultKeys;
          var separator = ", ";
          if (item.entryType in keysForTypes) {
            var obj = keysForTypes[item.entryType];
            keys = obj.keys;
            separator = obj.separator;
          }
          var values = valuesForKeys(keys, getTagsDictionary(item.entryTags));
          if (values.length > 0) {
            result += values.join(separator) + ".";
          }

          result += "</blockquote>";
        });

        result += "</div>";

        return result;
      },
    },
  },
};

function valuesForKeys(keys, dict) {
  var values = [];
  keys.forEach(function (key) {
    if (key in dict) {
      values.push(dict[key]);
    }
  });
  return values;
}

function getTagsDictionary(entryTags) {
  var tags = entryTags;
  if (entryTags.AUTHOR) {
    tags["AUTHOR"] = formatAuthors(entryTags.AUTHOR);
  }

  if (entryTags.JOURNAL) {
    tags["JOURNAL"] = "<i>" + entryTags.JOURNAL + "</i>";
  }
  if (entryTags.TITLE) {
    tags["TITLE"] = entryTags.TITLE;
  }
  if (entryTags.BOOKTITLE) {
    tags["BOOKTITLE_PLAIN"] = entryTags.BOOKTITLE;
    if (entryTags.BOOKURL) {
      tags["BOOKURL"] =
        '<i><a href="' +
        entryTags.BOOKURL +
        '">' +
        entryTags.BOOKURL +
        "</a></i>";
      tags["BOOKTITLE"] =
        '<i><a href="' +
        entryTags.BOOKURL +
        '">' +
        entryTags.BOOKTITLE +
        "</a></i>";
    } else {
      tags["BOOKTITLE"] = "<i>" + entryTags.BOOKTITLE + "</i>";
    }
  }
  if (entryTags.PUBLISHER) {
    tags["PUBLISHER"] = entryTags.PUBLISHER;
  }

  if (entryTags.NOTE) {
    tags["NOTE"] = "<br /><i>" + entryTags.NOTE + "</i>";
  }
  if (entryTags.YEAR) {
    tags["YEAR"] = "(" + entryTags.YEAR + ")";
  }
  if (entryTags.VOLUME) {
    tags["VOLUME"] = entryTags.VOLUME + "(" + entryTags.ISSUE + ")";
    if (entryTags.PAGES) {
      tags["VOLUME"] += ": " + entryTags.PAGES;
    }
  }
  if (entryTags.DOI) {
    tags["DOI"] =
      '<a href="http://dx.doi.org/' +
      entryTags.DOI +
      '">' +
      entryTags.DOI +
      "</a>";
  }
  if (entryTags.URL) {
    tags["URL"] = '<a href="' + entryTags.URL + '">' + entryTags.URL + "</a>";
  }
  return tags;
}

function formatAuthors(authorsString) {
  var authors = authorsString.split("and");

  if (authors.length > 3) {
    return authors[0] + " et al";
  } else {
    return authorsString;
  }
}
