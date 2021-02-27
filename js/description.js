window.addEventListener('DOMContentLoaded', () => {
  const solutions = [
    {
      name: 'NoVNC',
      description: '',
      urlImg: '',
      url: '',
    },
    {
      name: 'Kubernetes',
      description: '',
      urlImg: '',
      url: '',
    },
    {
      name: 'NGINX',
      description: '',
      urlImg: '',
      url: '',
    },
    {
      name: 'CheryPy',
      description: '',
      urlImg: '',
      url: '',
    },
    {
      name: 'Nodejs',
      description: '',
      urlImg: '',
      url: '',
    },
    {
      name: 'Wmctrljs',
      description: '',
      urlImg: '',
      url: '',
    },
  ];

  const cardsContainer = document.getElementById('cards-container');
  const fragment = document.createDocumentFragment();
  for (const solution of solutions) {
    const {
      description,
      name,
      urlImg,
      url,
    } = solution;

    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'col-6 d-flex justify-content-center';
    cardWrapper.style = 'padding-top:10px;padding-bottom:10px;';

    const card = document.createElement('div');
    card.className = 'card';
    card.style = 'padding-left:10px;padding-right:10px;';
    card.innerHTML = `
      <img src="${urlImg}" class="card-img-top" alt="${name}">
      <div class="card-body">
        <h5 class="card-title">${name}</h5>
        <p class="card-text">${description}</p>
        <a href="${url}" class="btn btn-dark">See it here</a>
      </div>
    `;

    cardWrapper.appendChild(card);
    fragment.appendChild(cardWrapper);
  }

  cardsContainer.appendChild(fragment);
});
