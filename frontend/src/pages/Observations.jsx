import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, DatePicker, Input, Select, Space, Popconfirm, Modal, message, Spin, Descriptions } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observationApi } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Observations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({});
  const [detail, setDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize, ...filters };
      const data = await observationApi.getList(params);
      setData(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (id) => {
    try {
      const res = await observationApi.getById(id);
      setDetail(res.observation);
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await observationApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (err) {
      message.error(err.error || '删除失败');
    }
  };

  const columns = [
    {
      title: '鸟种',
      dataIndex: 'chinese_name',
      key: 'chinese_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/species/${record.species_id}`)}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <div style={{ color: '#8c8c8c', fontSize: 12, fontStyle: 'italic' }}>{record.latin_name}</div>
        </a>
      ),
    },
    {
      title: '日期',
      dataIndex: 'observation_date',
      key: 'observation_date',
      width: 120,
      render: d => dayjs(d).format('YYYY-MM-DD'),
      sorter: (a, b) => new Date(a.observation_date) - new Date(b.observation_date),
    },
    {
      title: '地点',
      dataIndex: 'location_name',
      key: 'location_name',
      ellipsis: true,
      render: (text, record) => (
        <>
          <div>{text}</div>
          {(record.province || record.city) && (
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {record.province} {record.city}
            </div>
          )}
        </>
      ),
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      render: c => <Tag color="blue">{c}只</Tag>,
    },
    {
      title: '行为',
      dataIndex: 'behavior',
      key: 'behavior',
      width: 90,
      render: b => <Tag color="purple">{b}</Tag>,
    },
    {
      title: '天气',
      dataIndex: 'weather',
      key: 'weather',
      width: 80,
      render: w => w || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>
            查看
          </Button>
          <Popconfirm
            title="确定要删除这条观察记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索地点..."
            style={{ width: 200 }}
            allowClear
            onChange={e => setFilters(f => ({ ...f, _locationSearch: e.target.value }))}
            onPressEnter={() => loadData()}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters(f => ({
                  ...f,
                  date_from: dates[0]?.format('YYYY-MM-DD'),
                  date_to: dates[1]?.format('YYYY-MM-DD'),
                }));
              } else {
                setFilters(f => { const { date_from, date_to, ...rest } = f; return rest; });
              }
            }}
          />
          <Select
            placeholder="筛选行为"
            style={{ width: 140 }}
            allowClear
            onChange={v => setFilters(f => ({ ...f, _behavior: v }))}
          >
            {['取食', '求偶', '筑巢', '育雏', '迁徙', '休息', '鸣叫', '其他'].map(b => (
              <Option key={b} value={b}>{b}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => setPage(1)}>搜索</Button>
          <Button onClick={() => { setFilters({}); setPage(1); }}>重置</Button>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/observations/add')}>
              添加观察记录
            </Button>
          </div>
        </Space>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: t => `共 ${t} 条记录`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="观察记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {detail && (
          <>
            <div style={{
              height: 160,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 72,
              marginBottom: 20,
            }}>
              🐦
            </div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="鸟种" span={2}>
                <span style={{ fontWeight: 500 }}>{detail.chinese_name}</span>
                <div style={{ color: '#8c8c8c', fontSize: 12, fontStyle: 'italic' }}>{detail.latin_name}</div>
              </Descriptions.Item>
              <Descriptions.Item label="日期">{dayjs(detail.observation_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="数量"><Tag color="blue">{detail.count}只</Tag></Descriptions.Item>
              <Descriptions.Item label="地点" span={2}>{detail.location_name}</Descriptions.Item>
              {detail.province && (
                <Descriptions.Item label="省市" span={2}>{detail.province} {detail.city || ''} {detail.district || ''}</Descriptions.Item>
              )}
              <Descriptions.Item label="行为"><Tag color="purple">{detail.behavior}</Tag></Descriptions.Item>
              <Descriptions.Item label="天气">{detail.weather || '-'}</Descriptions.Item>
            </Descriptions>
            {detail.notes && (
              <>
                <div style={{ marginTop: 16, fontWeight: 500 }}>备注</div>
                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 6 }}>{detail.notes}</div>
              </>
            )}
            {detail.features && (
              <>
                <div style={{ marginTop: 16, fontWeight: 500 }}>鸟种特征</div>
                <div style={{ marginTop: 8, lineHeight: 1.8 }}>{detail.features}</div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
