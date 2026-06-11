import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Button, Empty, Spin } from 'antd';
import {
  FieldNumberOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { lifeListApi, observationApi, speciesApi } from '../api';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentObservations, setRecentObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, obsData] = await Promise.all([
        lifeListApi.getStats(),
        observationApi.getList({ page: 1, pageSize: 5 }),
      ]);
      setStats(statsData);
      setRecentObservations(obsData.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyChart = () => {
    const data = stats?.monthly_trend || [];
    const months = data.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`);
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['鸟种数', '观察次数'] },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value' },
      series: [
        {
          name: '鸟种数',
          type: 'bar',
          data: data.map(d => d.species_count),
          itemStyle: { color: '#667eea' },
        },
        {
          name: '观察次数',
          type: 'line',
          smooth: true,
          data: data.map(d => d.observation_count),
          itemStyle: { color: '#f5576c' },
        },
      ],
    };
  };

  const getOrderChart = () => {
    const data = stats?.by_order || [];
    return {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data.map(d => ({ name: d.name, value: d.count })),
        label: { show: true, formatter: '{b}: {c}' },
      }],
      color: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'],
    };
  };

  if (loading) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FieldNumberOutlined style={{ fontSize: 24, opacity: 0.8 }} />
            <div className="number" style={{ marginTop: 12 }}>{stats?.total?.species || 0}</div>
            <div className="label">累计鸟种</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CalendarOutlined style={{ fontSize: 24, opacity: 0.8 }} />
            <div className="number" style={{ marginTop: 12 }}>{stats?.total?.observations || 0}</div>
            <div className="label">观察次数</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <span style={{ fontSize: 24, opacity: 0.8 }}>🎯</span>
            <div className="number" style={{ marginTop: 12 }}>{stats?.year?.new_species || 0}</div>
            <div className="label">{stats?.year?.year}年新增</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <EnvironmentOutlined style={{ fontSize: 24, opacity: 0.8 }} />
            <div className="number" style={{ marginTop: 12 }}>{stats?.total?.days_observed || 0}</div>
            <div className="label">观鸟天数</div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="近一年趋势" extra={<Link to="/life-list"><Button type="link">查看详情 <ArrowRightOutlined /></Button></Link>}>
            <ReactECharts option={getMonthlyChart()} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="目级分布">
            {stats?.by_order?.length > 0 ? (
              <ReactECharts option={getOrderChart()} style={{ height: 280 }} />
            ) : (
              <Empty description="暂无数据" style={{ padding: 60 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="最近观察记录"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/observations/add')}>
                新增记录
              </Button>
            }
          >
              {recentObservations.length > 0 ? (
            <List
              dataSource={recentObservations}
              renderItem={item => (
                <List.Item
                  key={item.id}
                  actions={[<Tag color="blue">{item.count}只</Tag>]}
                >
                  <List.Item.Meta
                    avatar={<div style={{
                    width: 48, height: 48, borderRadius: 8,
                    background: '#f0f5ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  }}>🐦</div>}
                    title={<Link to={`/observations`}>{item.chinese_name}
                    <Tag style={{ marginLeft: 8 }} color="default">{item.behavior}</Tag></Link>}
                    description={
                    <>
                      <div>
                        <EnvironmentOutlined /> {item.location_name}
                        <span style={{ marginLeft: 16 }}>
                          <CalendarOutlined /> {dayjs(item.observation_date).format('YYYY-MM-DD')}
                        </span>
                      </div>
                      <div style={{ color: '#8c8c8c', marginTop: 4 }}>{item.notes || '暂无备注'}</div>
                    </>
                  }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="还没有观察记录" />
          )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="热门观鸟地TOP5">
            {stats?.top_locations?.length > 0 ? (
            <List
              dataSource={stats.top_locations.slice(0, 5)}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                  avatar={<Tag color={index < 3 ? 'gold' : 'default'} style={{ width: 32, height: 32, textAlign: 'center', borderRadius: '50%', marginRight: 12 }}>
                    {index + 1}
                  </Tag>}
                  title={item.location_name}
                  description={
                  <>
                    <Tag color="blue">{item.species_count}种鸟</Tag>
                    <Tag color="green">{item.observation_count}次观察</Tag>
                    {item.city && <Tag>{item.province} {item.city}</Tag>}
                  </>
                }
                />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
