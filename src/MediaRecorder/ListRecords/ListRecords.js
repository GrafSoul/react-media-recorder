import React from 'react';

const ListRecords = ({ list, deleteEntry }) => {
    return (
        <ul className="list-media">
            {list.map((item, index) => {
                return (
                    <li key={index}>
                        {item}
                        <button
                            className="btn btn-danger"
                            onClick={() => deleteEntry(index)}
                        >
                            X
                        </button>
                    </li>
                );
                item;
            })}
        </ul>
    );
};

export default ListRecords;
