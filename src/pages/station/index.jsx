import { Table } from 'antd'
import api from '../../config/axios';
import React, { useEffect, useState } from 'react'

const ManageStation = () => {

  const [stations, setStations] = useState([]);

  const columns = [
    {
      title: 'Station ID',
      dataIndex: 'stationId',
      key: 'stationId',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{
          color: status === 'online' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {status === 'online' ? 'Online' : 'Offline'}
        </span>
      )
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => rating ? `${rating}/5` : 'N/A'
    }
  ];

  const fetchStation = async () => {
    const response = await api.get('ChargingStation');
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
