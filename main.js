// main.js

let searchMatches = [];
let searchIndex = 0;
let lastSearchTerm = '';
let initialViewBox = null;

function collectMatches(searchTerm) {
    const svg = document.getElementById('tree-svg');
    if (!svg) return [];

    svg.querySelectorAll('foreignObject').forEach(f => {
        f.style.outline = '';
        f.style.boxSizing = '';
    });

    if (!searchTerm) return [];

    const matches = [];
    svg.querySelectorAll('text.name').forEach(textEl => {
        if (textEl.textContent.trim().toLowerCase().includes(searchTerm)) {
            const el = textEl.closest('g[data-shape-id]');
            if (el) {
                const foreignObj = Array.from(el.children).find(
                    child => child.tagName === 'foreignObject'
                );
                if (foreignObj) {
                    foreignObj.style.outline = '10px solid #32475b';
                    foreignObj.style.boxSizing = 'border-box';
                    matches.push(foreignObj);
                }
            }
        }
    });
    return matches;
}

function centerOnForeignObj(foreignObj) {
    const shapeId = foreignObj.closest('g[data-shape-id]').getAttribute('data-shape-id');
    const node = familyTree.getNode(shapeId);
    if (node) {
        familyTree.center(node);
        return;
    }
    // fallback : manipulation directe du viewBox
    const svg = document.getElementById('tree-svg');
    if (!svg) return;
    const rect = foreignObj.getBoundingClientRect();
    const pt = svg.createSVGPoint();
    pt.x = rect.left + rect.width / 2;
    pt.y = rect.top + rect.height / 2;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    const vb = svg.viewBox.baseVal;
    svg.setAttribute('viewBox',
        `${svgPt.x - vb.width / 2} ${svgPt.y - vb.height / 2} ${vb.width} ${vb.height}`
    );
}


function loadJsonFile(callback) {
    document.getElementById('file-input').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    callback(data);
                } else {
                    alert("Le fichier JSON n'est pas un tableau !");
                }
            } catch (err) {
                alert("Erreur lors de la lecture du JSON : " + err.message);
            }
        };

        reader.readAsText(file);
    });
}

document.getElementById('custom-file-btn').addEventListener('click', function () {
    // Ouvre le dialogue de sélection de fichier
    document.getElementById('file-input').click();
});

function loadJsonAutomated(callback) {
    // Utilisez un chemin relatif (sans '/' au début pour éviter la racine du domaine)
    fetch('family.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Impossible de charger le fichier JSON (" + response.status + ")");
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                callback(data);
            } else {
                alert("Le fichier JSON n'est pas un tableau !");
            }
        })
        .catch(err => {
            alert("Erreur lors de la lecture du JSON : " + err.message);
        });
}


document.addEventListener('DOMContentLoaded', function () {
    loadJsonAutomated(function (data) {
        familyTree.addFamilyMembers(data);
        familyTree.draw(1, familyTree.fit, function () {
            const svg = document.querySelector('#tree svg');
            if (svg) svg.setAttribute('id', 'tree-svg');

            const treeSvg = document.getElementById('tree-svg');
            if (!treeSvg) return;

            const rootG = treeSvg.querySelector('g[data-shape-id="1"]');
            const fo = rootG && rootG.querySelector('foreignObject');
            if (!fo) return;

            const rect = fo.getBoundingClientRect();
            const pt = treeSvg.createSVGPoint();
            pt.x = rect.left + rect.width / 2;
            pt.y = rect.top;
            const svgPt = pt.matrixTransform(treeSvg.getScreenCTM().inverse());

            const vb = treeSvg.viewBox.baseVal;
            const newViewBox = `${svgPt.x - vb.width / 2} ${svgPt.y - 60} ${vb.width} ${vb.height}`;
            treeSvg.setAttribute('viewBox', newViewBox);
            initialViewBox = newViewBox;
        });
    });

    document.getElementById('search-btn').addEventListener('click', function () {
        const term = document.getElementById('svg-search').value.trim().toLowerCase();
        if (term !== lastSearchTerm) {
            searchMatches = collectMatches(term);
            searchIndex = 0;
            lastSearchTerm = term;
        }
        if (searchMatches.length === 0) return;
        centerOnForeignObj(searchMatches[searchIndex]);
        searchIndex = (searchIndex + 1) % searchMatches.length;
    });

    document.getElementById('svg-search').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('search-btn').click();
    });

    document.getElementById('svg-search').addEventListener('input', function () {
        if (!this.value.trim()) {
            const svg = document.getElementById('tree-svg');
            if (svg) svg.querySelectorAll('foreignObject').forEach(f => {
                f.style.outline = '';
                f.style.boxSizing = '';
            });
            searchMatches = [];
            searchIndex = 0;
            lastSearchTerm = '';
        }
    });
});


// Définition du template

let template = FamilyTree2.createTemplate("myCustomTemplate");

template.defs =
    `<linearGradient id="my_grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#D0D0D0;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#909090;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="my_grad_female" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#FF8024;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#FF46A3;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="my_grad_male" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#00D3A5;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00A7D4;stop-opacity:1" />
            </linearGradient>`;

template.svg = function (node) {
    let url = node.familyMember.sexOrGender == "male" ? "my_grad_male" :
        (node.familyMember.sexOrGender == "female" ? "my_grad_female" : "my_grad");
    return `<clipPath id="my_template_photo">
                <rect id="my_template_photo_stroke" stroke-width="2" stroke="#fff" x="250" y="-5" rx="25" ry="25" width="100" height="100"></rect>
            </clipPath>

            <rect rx="7" ry="7" x="0" y="0" 
                width="${node.width}" height="${node.height}" 
                style=" stroke:${node.stroke}; fill: url(#${url}); stroke-width: 1;">
            </rect>`;
};

template.link.stroke = "#aeaeae";
template.link.strokeWidth = 1;
template.width = 600;
template.height = 250;
template.nodes.child.width = 600;
template.nodes.child.height = 250;
template.nodes.childInLaw.width = 600;
template.nodes.childInLaw.height = 250;

let separations = template.separations;
separations.focusSide = 100;
separations.parentLevel = 100;
separations.parentSide = 150;
separations.parentNeighbor = 110;
separations.childInLowNeighbor = 90;
separations.focusBottom = 150;
separations.childSide = 100;
separations.childLevel = 150;
separations.childNeighbor = 100;
separations.parentSiblingNeighbor = 90;
separations.parentSiblingLevel = 180;
separations.parentInLawLevel = 110;
separations.parentInLawNeighbor = 90;
separations.piblingNeighbor = 90;
separations.siblingNeighbor = 90;
separations.spouseNeighbor = 90;
separations.stepParentNeighbor = 90;

template.html = function (node) { return `` };

template.insertSvg = function (node) {
    let familyPhoto = "https://placehold.co/100x100.png";
    if (node.familyMember.photo) {
        familyPhoto = node.familyMember.photo
    }

    text = `<use xlink:href="#my_template_photo_stroke" />
            <image preserveAspectRatio="xMidYMid slice" 
                clip-path="url(#my_template_photo)" 
                xlink:href="${familyPhoto}" 
                x="250" y="-5" width="100" height="100">
            </image>
            <text class="name" fill="white" text-anchor="middle"
                x="${node.width / 2}" y="${node.height / 2 + 5}">
                ${node.familyMember.name}
            </text>
            <text fill="white" text-anchor="left"
                x="20" y="${node.height / 2 + 45}">
                Naissance: ${node.familyMember.dateOfBirth} - ${node.familyMember.cityOfBirth}
            </text>`;

    if (node.familyMember.dateOfDeath) {
        text += `
            <text fill="white" text-anchor="left"
                x="20" y="${node.height / 2 + 65}">
                Décès: ${node.familyMember.dateOfDeath} - ${node.familyMember.cityOfDeath ?? "-"}
            </text>`;
    }

    if (node.familyMember.weddingDate) {
        text += `
            <text fill="white" text-anchor="letf"
                x="20" y="${node.height / 2 + 85}">
                Mariage: ${node.familyMember.weddingDate} - ${node.familyMember.weddingCity ?? "-"}
            </text>`;
    }

    return text;
}


// Génaration du tree
let familyTree = new FamilyTree2(document.getElementById("tree"));
familyTree.templateName = "myCustomTemplate";
familyTree.readOnly = true;
familyTree.editable = false;

familyTree.controlsUI.show({
    zoom_in: { title: 'zoom in' },
    zoom_out: { title: 'zoom out' },
});

familyTree.onNodeClick(function (args) {
    if (this.readOnly) {
        this.centerNodes([args.node]);
    }
});

document.getElementById('tree').addEventListener('dblclick', function (e) {
    if (!e.target.closest('g[data-shape-id]') && initialViewBox) {
        document.getElementById('tree-svg').setAttribute('viewBox', initialViewBox);
    }
});