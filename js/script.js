// variables
let map;
let infoWindow;
let markers = [];
let geocaches = [];

// init
function initMap() {
    const pos = { lat: 32.253, lng: -110.912 };// (Tucson, Arizona)

    map = new google.maps.Map(document.getElementById('map'), {
        center: pos,
        zoom: 11
    });
    
    infoWindow = new google.maps.InfoWindow();
    
    loadCacheTypes();
    
    setupEventListeners();
    
    searchGeocaches();
}

function loadCacheTypes() {
    fetch('api/get_cache_types.php')
        .then(response => response.json())
        .then(data => {
            const cacheTypeSelect = document.getElementById('cacheType');
            
            data.forEach(type => {
                const option = document.createElement('option');
                option.value = type.type_id;
                option.textContent = type.cache_type;
                cacheTypeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading cache types:', error);
        });
}

function setupEventListeners() {
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchGeocaches();
    });
    
    document.getElementById('useMyLocation').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    document.getElementById('latitude').value = position.coords.latitude;
                    document.getElementById('longitude').value = position.coords.longitude;
                    searchGeocaches();
                },
                () => {
                    alert('Error: The Geolocation service failed.');
                }
            );
        } else {
            alert('Error: Your browser doesn\'t support geolocation.');
        }
    });
}

function searchGeocaches() {
    clearMarkers();
    
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const distance = parseInt(document.getElementById('distance').value);
    const cacheType = document.getElementById('cacheType').value;
    const difficulty = document.getElementById('difficulty').value;
    
    const center = new google.maps.LatLng(latitude, longitude);
    map.setCenter(center);
    
    // circle to visualize the search radius
    const circle = new google.maps.Circle({
        center: center,
        radius: distance * 1609.34, 
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.1,
        map: map
    });
    
    map.fitBounds(circle.getBounds());
    
    const bounds = circle.getBounds();
    const maxLat = bounds.getNorthEast().lat();
    const minLat = bounds.getSouthWest().lat();
    const maxLng = bounds.getNorthEast().lng();
    const minLng = bounds.getSouthWest().lng();
    
    const searchData = {
        minLat: minLat,
        maxLat: maxLat,
        minLng: minLng,
        maxLng: maxLng,
        cacheType: cacheType,
        difficulty: difficulty
    };
    
    fetch('api/search_geocaches.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
    })
    .then(response => response.json())
    .then(data => {
        geocaches = data;
        
        displayGeocaches(data);
    })
    .catch(error => {
        console.error('Error searching geocaches:', error);
    });
    
    document.getElementById('cacheInfoContainer').classList.add('d-none');
}

function displayGeocaches(geocaches) {
    const tableBody = document.getElementById('geocacheTableBody');
    tableBody.innerHTML = '';
    
    geocaches.forEach((cache, index) => {
        //  marker for the geocache
        const position = new google.maps.LatLng(parseFloat(cache.latitude), parseFloat(cache.longitude));
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: `${cache.cache_type}, Difficulty: ${cache.difficulty_rating}`
        });
        
        // click event on the marker
        marker.addListener('click', () => {
            showCacheInfo(cache);
        });
        
        markers.push(marker);
        
        // displaying the geocache to the table
        const row = document.createElement('tr');
        row.className = 'clickable-row';
        row.innerHTML = `
            <td>${cache.latitude}</td>
            <td>${cache.longitude}</td>
            <td>${cache.cache_type}</td>
            <td>${cache.difficulty_rating}</td>
        `;
        
        row.addEventListener('click', () => {
            showCacheInfo(cache);
            
            const selectedRows = document.querySelectorAll('.table-primary');
            selectedRows.forEach(row => row.classList.remove('table-primary'));
            row.classList.add('table-primary');
        });
        
        tableBody.appendChild(row);
    });
}

// information about a selected geocache
function showCacheInfo(cache) {
    document.getElementById('cacheInfoContainer').classList.remove('d-none');
    
    document.getElementById('selectedCacheTitle').textContent = `${cache.latitude}, ${cache.longitude}`;
    document.getElementById('selectedCacheDetails').textContent = `${cache.cache_type}, Difficulty: ${cache.difficulty_rating}`;
    
    const position = new google.maps.LatLng(parseFloat(cache.latitude), parseFloat(cache.longitude));
    map.setCenter(position);
    
    infoWindow.setPosition(position);
    infoWindow.setContent(`
        <div>
            <strong>${cache.latitude}, ${cache.longitude}</strong><br>
            ${cache.cache_type}, Difficulty: ${cache.difficulty_rating}
        </div>
    `);
    infoWindow.open(map);
    
    loadFlickrPhotos(cache.latitude, cache.longitude);
}

function loadFlickrPhotos(latitude, longitude) {
    const photoContainer = document.getElementById('photoContainer');
    photoContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    
    const lat_adjustment = 0.009; 
    const lng_adjustment = 0.012;  
    
    const minLat = parseFloat(latitude) - lat_adjustment;
    const maxLat = parseFloat(latitude) + lat_adjustment;
    const minLng = parseFloat(longitude) - lng_adjustment;
    const maxLng = parseFloat(longitude) + lng_adjustment;
    
    // bbox parameter for Flickr
    const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
    
    // Flickr API request
    fetch(`api/get_flickr_photos.php?bbox=${bbox}`)
        .then(response => response.json())
        .then(data => {
            photoContainer.innerHTML = '';
            
            if (data.photos && data.photos.photo && data.photos.photo.length > 0) {
                const maxPhotos = Math.min(12, data.photos.photo.length);
                
                for (let i = 0; i < maxPhotos; i++) {
                    const photo = data.photos.photo[i];
                    
                    const photoUrl = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_t.jpg`;
                    
                    const img = document.createElement('img');
                    img.src = photoUrl;
                    img.alt = photo.title;
                    img.title = photo.title;
                    
                    const link = document.createElement('a');
                    link.href = `https://www.flickr.com/photos/${photo.owner}/${photo.id}`;
                    link.target = '_blank';
                    link.appendChild(img);
                    
                    photoContainer.appendChild(link);
                }
            } else {
                photoContainer.innerHTML = '<p>No photos found for this location.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading Flickr photos:', error);
            photoContainer.innerHTML = '<p>Error loading photos. Please try again later.</p>';
        });
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    
    markers = [];
    
    if (infoWindow) {
        infoWindow.close();
    }
}

window.onload = initMap;