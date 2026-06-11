import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Pagination, Spin, Empty, Select, Input, Tabs, Progress, Statistic, Divider } from 'antd';
import { SearchOutlined, TrophyOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Link, useNavigate } from 'react-router-dom';
import { lifeListApi, speciesApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

export default function LifeList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [selectedOrder, setSelectedOrder] = useState();
  const [selectedFamily, setSelectedFamily] = useState();
  const [meta, setMeta] = useState({ orders: [], families: [] });

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [page, pageSize, keyword, selectedOrder, selectedFamily]);

  const loadMeta = async () => {
    try {
      const data = await speciesApi.getMeta();
      setMeta(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (selectedOrder) params.order = selectedOrder;
      if (selectedFamily) params.family = selectedFamily;

      const [statsData, listData] = await Promise.all([
        lifeListApi.getStats(),
        lifeListApi.getList(params),
      ]);
      setStats(statsData);
      setList(listData.list || []);
      setTotal(listData.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const getMonthlyChart = () => {
    const data = stats?.monthly_trend || [];
    const months = data.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`);
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: data.map(d => d.species_count),
        itemStyle: { color: '#667eea' },
        barWidth: '60%',
      }],
    };
  };

  const getOrderChart = () => {
    const data = stats?.by_order || [];
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [{
        type: 'pie',
        radius: '60%',
        center: ['50%', '45%'],
        data: data.map(d => ({ name: d.name, value: d.count })),
        label: { show: true, formatter: '{b}: {c}' },
      }],
      color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
    };
  };

  const getProgressData = () => {
    const total = stats?.total?.species || 0;
    return [
      { label: '观鸟入门', target: 25, current: total, color: '#52c41a' },
      { label: '观鸟达人', target: 50, current: total, color: '#1677ff' },
      { label: '鸟类专家', target: 100, current: total, color: '#722ed1' },
      { label: '鸟类学家', target: 200, current: total, color: '#eb2f96' },
    ];
  };

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Statistic title="累计鸟种（生命列表）" value={stats?.total?.species || 0} valueStyle={{ color: 'white', fontSize: 32 }} />
              <div style={{ marginTop: 8, opacity: 0.9, fontSize: 13 }}>
                {stats?.total?.first_date ? `首次: ${dayjs(stats.total.first_date).format('YYYY-MM-DD')}` : '还没有记录'}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <Statistic title={`${stats?.year?.year || new Date().getFullYear()}年新增`} value={stats?.year?.new_species || 0} valueStyle={{ color: 'white', fontSize: 32 }} />
              <div style={{ marginTop: 8, opacity: 0.9, fontSize: 13 }}>
                今年的新鸟种
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <Statistic title="总观察次数" value={stats?.total?.observations || 0} valueStyle={{ color: 'white', fontSize: 32 }} />
              <div style={{ marginTop: 8, opacity: 0.9, fontSize: 13 }}>
                <CalendarOutlined /> 观鸟 {stats?.total?.days_observed || 0} 天
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <Statistic title="累计计数" value={stats?.total?.birds_counted || 0} valueStyle={{ color: 'white', fontSize: 32 }} />
              <div style={{ marginTop: 8, opacity: 0.9, fontSize: 13 }}>
                所有记录鸟只数总和
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={10}>
            <Card title="🎯 里程碑进度">
              {getProgressData().map(item => {
                const percent = Math.min(100, Math.round(item.current / item.target * 100));
                const completed = item.current >= item.target;
                return (
                  <div key={item.label} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 500 }}>{item.label} {completed && <Tag color="green">✓ 已达成</Tag>}</span>
                      <span style={{ color: '#8c8c8c' }}>{item.current} / {item.target}</span>
                    </div>
                    <Progress percent={percent} showInfo={false} strokeColor={item.color} />
                  </div>
                );
              })}
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title="📊 目级分布">
              {stats?.by_order?.length > 0 ? (
                <ReactECharts option={getOrderChart()} style={{ height: 280 }} />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="📈 近一年新增趋势" style={{ marginBottom: 16 }}>
          {stats?.monthly_trend?.length > 0 ? (
            <ReactECharts option={getMonthlyChart()} style={{ height: 240 }} />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Card>

        <Card title="📍 热门观鸟地 TOP 10" style={{ marginBottom: 16 }}>
          {stats?.top_locations?.length > 0 ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 5 }}
              dataSource={stats.top_locations.slice(0, 10)}
              renderItem={(item, index) => (
                <List.Item>
                  <Card hoverable size="small">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Tag color={index < 3 ? 'gold' : 'default'} style={{ fontSize: 16, padding: '4px 10px' }}>
                        {index + 1}
                      </Tag>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.location_name}>
                          <EnvironmentOutlined /> {item.location_name}
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                          <Tag color="blue" style={{ marginRight: 4 }}>{item.species_count}种</Tag>
                          <Tag color="green">{item.observation_count}次</Tag>
                        </div>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Card>

        <Card
          title={
            <span>
              <TrophyOutlined /> 我的鸟单
              <Tag style={{ marginLeft: 12 }} color="blue">共 {total} 种</Tag>
            </span>
          }
          extra={
            <div style={{ display: 'flex', gap: 12 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索鸟种..."
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(1); }}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="目"
                allowClear
                value={selectedOrder}
                onChange={v => { setSelectedOrder(v); setSelectedFamily(); setPage(1); }}
                style={{ width: 140 }}
              >
                {meta.orders.map(o => <Option key={o.name} value={o.name}>{o.name}</Option>)}
              </Select>
              <Select
                placeholder="科"
                allowClear
                value={selectedFamily}
                onChange={v => { setSelectedFamily(v); setPage(1); }}
                style={{ width: 140 }}
              >
                {filteredFamilies.map(f => <Option key={f.name} value={f.name}>{f.name}</Option>)}
              </Select>
            </div>
          }
        >
          {list.length > 0 ? (
            <>
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                dataSource={list}
                renderItem={item => (
                  <List.Item>
                    <Card
                      hoverable
                      className="bird-card"
                      onClick={() => navigate(`/species/${item.species_id}`)}
                    >
                      <div style={{
                        height: 100,
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        marginBottom: 12,
                      }}>
                        🐦
                      </div>
                      <div style={{ fontWeight: 500 }}>{item.chinese_name}</div>
                      <div style={{ color: '#8c8c8c', fontSize: 11, fontStyle: 'italic', marginBottom: 6 }}>
                        {item.latin_name}
                      </div>
                      <Tag color="blue" style={{ marginRight: 4 }}>{item.bird_order}</Tag>
                      <Tag color="purple">{item.family}</Tag>
                      {item.conservation_status && (
                        <div style={{ marginTop: 6 }}>
                          <Tag color={getConservationColor(item.conservation_status)} style={{ fontSize: 11 }}>
                            {item.conservation_status}
                          </Tag>
                        </div>
                      )}
                      <Divider style={{ margin: '10px 0' }} />
                      <div style={{ fontSize: 12, color: '#595959' }}>
                        <div>首次发现: {dayjs(item.first_observed_date).format('YYYY-MM-DD')}</div>
                        {item.first_observed_location && (
                          <div style={{ marginTop: 2 }}>
                            <EnvironmentOutlined /> {item.first_observed_location}
                          </div>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
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
            <Empty description="个人鸟单还是空的，快去记录你的第一只鸟吧！" style={{ padding: 60 }}>
              <Link to="/observations/add">
                <a type="primary">添加观察记录</a>
              </Link>
            </Empty>
          )}
        </Card>
      </Spin>
    </div>
  );
}
