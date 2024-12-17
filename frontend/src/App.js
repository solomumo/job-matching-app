import React, { useEffect, useState } from 'react';
import api from './services/api';

function App() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.get('jobs/')
           .then(response => setData(response.data))
           .catch(error => console.error(error));
    }, []);

    return (
        <div>
            <h1>Job Matching App</h1>
            {data.map(job => (
                <div key={job.id}>
                    <h2>{job.title}</h2>
                    <p>{job.company}</p>
                </div>
            ))}
        </div>
    );
}

export default App;
