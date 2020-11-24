import React from 'react';

const ListRecords = ({ list }) => {
    return (
        <ul className="list-media">
            {list.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
};

export default ListRecords;
