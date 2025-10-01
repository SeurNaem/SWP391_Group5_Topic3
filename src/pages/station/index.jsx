import { Table } from 'antd'
import axios from 'axios';
import React, { useEffect, useState } from 'react'

const ManageStation = () => {

  const [stations, setStations] = useState([]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  const fetchStation = async () => {
    const response = await axios.get(
      'https://68d390e7214be68f8c6646ef.mockapi.io/station'
    );
    console.log(response.data);
    setStations(response.data);
  };

  useEffect(() => {
    fetchStation();
  }, []);

  return (
    <div>
      <Table dataSource={stations} columns={columns} />;
    </div>
  )
}

export default ManageStation
