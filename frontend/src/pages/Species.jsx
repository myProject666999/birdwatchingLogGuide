import { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Select, Tag, Pagination, Spin, Empty, Button, Drawer, Descriptions, Divider } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { speciesApi } from '../api';

const { Meta } = Card;
const { Option } = Select;

export default function Species() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [keyword, setKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState();
  const [selectedFamily, setSelectedFamily] = useState();
  const [meta, setMeta] = useState({ orders: [], families: [] });
  const [detail, setDetail] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadList();
  }, [page, pageSize, keyword, selectedOrder, selectedFamily]);

  const loadMeta = async () => {
    try {
      const data = await speciesApi.getMeta();
      setMeta(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (selectedOrder) params.order = selectedOrder;
      if (selectedFamily) params.family = selectedFamily;
      const data = await speciesApi.getList(params);
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (id) => {
    try {
      const data = await speciesApi.getById(id);
      setDetail(data.species);
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFamilies = selectedOrder
    ? meta.families.filter(f => f.order_name === selectedOrder)
    : meta.families;

  const getConservationColor = (status) => {
    if (!status) return 'default';
    if (status.includes('一级')) return 'red';
    if (status.includes('二级')) return 'orange';
    return 'green';
  };

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input
              size="large"
              prefix={<SearchOutlined />}
              placeholder="搜索中文名、拉丁名、英文名..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6}>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="选择目"
              allowClear
              value={selectedOrder}
              onChange={v => { setSelectedOrder(v); setSelectedFamily(); setPage(1); }}
            >
              {meta.orders.map(o => (
                <Option key={o.name} value={o.name}>{o.name} ({o.count})</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6}>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="选择科"
              allowClear
              value={selectedFamily}
              onChange={v => { setSelectedFamily(v); setPage(1); }}
            >
              {filteredFamilies.map(f => (
                <Option key={f.name} value={f.name}>{f.name} ({f.count})</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={4} style={{ textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={() => navigate('/observations/add')}>
              + 记录观察
            </Button>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {list.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {list.map(item => (
                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={item.id}>
                  <Card
                    hoverable
                    className="bird-card"
                    actions={[
                      <EyeOutlined key="view" onClick={() => showDetail(item.id)} />
                    ]}
                  >
                    <div style={{
                      height: 120,
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 60,
                      marginBottom: 12,
                    }}>
                      🐦
                    </div>
                    <Meta
                      title={
                      <Link to={`/species/${item.id}`}>{item.chinese_name}</Link>
                    }
                      description={
                      <>
                        <div style={{ color: '#8c8c8c', fontSize: 12, fontStyle: 'italic', marginBottom: 4 }}>
                          {item.latin_name}
                        </div>
                        <Tag color="blue" style={{ marginBottom: 4 }}>{item.bird_order}</Tag>
                        <Tag color="purple">{item.family}</Tag>
                        {item.conservation_status && (
                          <Tag color={getConservationColor(item.conservation_status)} style={{ marginTop: 4 }}>
                            {item.conservation_status}
                          </Tag>
                        )}
                      </>
                    }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showTotal={(t) => `共 ${t} 种鸟`}
                onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无鸟种数据，请调整筛选条件" style={{ padding: 80 }} />
        )}
      </Spin>

      <Drawer
        title={detail?.chinese_name}
        width={560}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detail && (
          <>
            <div style={{
              height: 200,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 80,
              marginBottom: 24,
            }}>
              🐦
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="中文名">{detail.chinese_name}</Descriptions.Item>
              <Descriptions.Item label="拉丁名" labelStyle={{ fontStyle: 'italic' }}>{detail.latin_name}</Descriptions.Item>
              {detail.english_name && <Descriptions.Item label="英文名">{detail.english_name}</Descriptions.Item>}
              <Descriptions.Item label="目">{detail.bird_order}</Descriptions.Item>
              <Descriptions.Item label="科">{detail.family}</Descriptions.Item>
              {detail.genus && <Descriptions.Item label="属">{detail.genus}</Descriptions.Item>}
              {detail.conservation_status && (
                <Descriptions.Item label="保护级别">
                  <Tag color={getConservationColor(detail.conservation_status)}>{detail.conservation_status}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
            <Divider orientation="left">特征描述</Divider>
            <p style={{ lineHeight: 1.8 }}>{detail.features || '暂无描述'}</p>
            <Divider orientation="left">分布范围</Divider>
            <p style={{ lineHeight: 1.8 }}>{detail.distribution || '暂无信息'}</p>
            {detail.habitat && (
              <>
                <Divider orientation="left">栖息环境</Divider>
                <p style={{ lineHeight: 1.8 }}>{detail.habitat}</p>
              </>
            )}
            <div style={{ marginTop: 24 }}>
              <Button type="primary" block onClick={() => {
                setDetailVisible(false);
                navigate('/observations/add', { state: { speciesId: detail.id } });
              }}>
                记录这种鸟
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
