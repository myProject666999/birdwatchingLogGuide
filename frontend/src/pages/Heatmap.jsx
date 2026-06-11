import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Select, Radio, Empty, Spin, Table, Statistic, Divider, Input } from 'antd';
import { EnvironmentOutlined, TeamOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { heatmapApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

const periods = [
  { label: '近一周', value: 'week' },
  { label: '近一月', value: 'month' },
  { label: '近一年', value: 'year' },
  { label: '全部', value: 'all' },
];

export default function Heatmap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [selectedProvince, setSelectedProvince] = useState();
  const [selectedCity, setSelectedCity] = useState();

  useEffect(() => {
    loadData();
  }, [period, selectedProvince, selectedCity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (selectedProvince) params.province = selectedProvince;
      if (selectedCity) params.city = selectedCity;
      const res = await heatmapApi.getData(params);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getProvinceChart = () => {
    const provinces = data?.by_province || [];
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0];
          const info = provinces.find(x => x.name === p.name);
          return `${p.name}<br/>
            🐦 鸟种数: ${info?.species_count || 0}<br/>
            📝 观察次数: ${info?.observation_count || 0}<br/>
            👥 观鸟人数: ${info?.observer_count || 0}<br/>
            📍 观鸟点: ${info?.location_count || 0}`;
        },
      },
      grid: { left: 80, right: 30, top: 20, bottom: 40 },
      xAxis: { type: 'value', name: '鸟种数' },
      yAxis: {
        type: 'category',
        data: provinces.slice(0, 15).map(p => p.name).reverse(),
      },
      series: [{
        type: 'bar',
        data: provinces.slice(0, 15).map(p => p.species_count).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: { show: true, position: 'right', formatter: '{c}种' },
      }],
    };
  };

  const getCityChart = () => {
    const cities = data?.by_city || [];
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: 80, right: 30, top: 20, bottom: 40 },
      xAxis: { type: 'value', name: '鸟种数' },
      yAxis: {
        type: 'category',
        data: cities.slice(0, 20).map(c => c.name).reverse(),
      },
      series: [{
        type: 'bar',
        data: cities.slice(0, 20).map(c => c.species_count).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#f093fb' },
              { offset: 1, color: '#f5576c' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: { show: true, position: 'right', formatter: '{c}种' },
      }],
    };
  };

  const getLocationColumns = () => [
    {
      title: '观鸟点',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/heatmap/hotspot/${encodeURIComponent(text)}`)}>
          <EnvironmentOutlined /> {text}
          {(record.province || record.city) && (
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {record.province} {record.city}
            </div>
          )}
        </a>
      ),
    },
    {
      title: '鸟种数',
      dataIndex: 'species_count',
      key: 'species_count',
      width: 100,
      sorter: (a, b) => a.species_count - b.species_count,
      render: c => <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>{c}种</Tag>,
    },
    {
      title: '观察次数',
      dataIndex: 'observation_count',
      key: 'observation_count',
      width: 100,
      sorter: (a, b) => a.observation_count - b.observation_count,
      render: c => <Tag color="purple">{c}次</Tag>,
    },
    {
      title: '累计鸟数',
      dataIndex: 'total_birds',
      key: 'total_birds',
      width: 100,
      sorter: (a, b) => (a.total_birds || 0) - (b.total_birds || 0),
      render: c => c || 0,
    },
  ];

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontSize: 14, color: '#595959', marginBottom: 4 }}>时间范围</div>
              <Radio.Group
                options={periods}
                value={period}
                onChange={e => setPeriod(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontSize: 14, color: '#595959', marginBottom: 4 }}>省份筛选</div>
              <Select
                style={{ width: '100%' }}
                placeholder="全部省份"
                allowClear
                value={selectedProvince}
                onChange={v => { setSelectedProvince(v); setSelectedCity(); }}
                showSearch
                optionFilterProp="children"
              >
                {(data?.by_province || []).map(p => (
                  <Option key={p.name} value={p.name}>{p.name} ({p.species_count}种)</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ fontSize: 14, color: '#595959', marginBottom: 4 }}>城市筛选</div>
              <Select
                style={{ width: '100%' }}
                placeholder="全部城市"
                allowClear
                value={selectedCity}
                onChange={setSelectedCity}
                showSearch
                optionFilterProp="children"
                disabled={!selectedProvince && data?.by_city?.length === 0}
              >
                {(data?.by_city || [])
                  .filter(c => !selectedProvince || c.province === selectedProvince)
                  .map(c => (
                    <Option key={c.name} value={c.name}>{c.name} ({c.species_count}种)</Option>
                  ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} style={{ textAlign: 'right' }}>
              <Tag color="green">共 {data?.summary?.total_hotspots || 0} 个观鸟点</Tag>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<span style={{ fontSize: 13 }}><EnvironmentOutlined /> 观鸟点</span>}
                value={data?.summary?.total_hotspots || 0}
                valueStyle={{ color: '#1677ff', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<span style={{ fontSize: 13 }}>🐦 记录鸟种</span>}
                value={data?.summary?.total_species || 0}
                valueStyle={{ color: '#722ed1', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<span style={{ fontSize: 13 }}><CalendarOutlined /> 观察次数</span>}
                value={data?.summary?.total_observations || 0}
                valueStyle={{ color: '#eb2f96', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title={<span style={{ fontSize: 13 }}><TeamOutlined /> 覆盖省份</span>}
                value={data?.by_province?.length || 0}
                valueStyle={{ color: '#52c41a', fontSize: 28 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="📊 省份鸟种排行 TOP 15">
              {data?.by_province?.length > 0 ? (
                <ReactECharts option={getProvinceChart()} style={{ height: 400 }} />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="🏙️ 城市鸟种排行 TOP 20">
              {data?.by_city?.length > 0 ? (
                <ReactECharts option={getCityChart()} style={{ height: 400 }} />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Card
          title="📍 热门观鸟点排行"
          extra={<span style={{ color: '#8c8c8c' }}>点击地点查看详情</span>}
        >
          {data?.locations?.length > 0 ? (
            <Table
              rowKey="location_name"
              columns={getLocationColumns()}
              dataSource={data.locations}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: t => `共 ${t} 个观鸟点`,
              }}
            />
          ) : (
            <Empty description="暂无公开的观察记录" style={{ padding: 60 }}>
              <div style={{ color: '#8c8c8c', marginTop: 12 }}>
                快去 <a onClick={() => navigate('/observations/add')}>记录观察</a> 并设置公开吧！
              </div>
            </Empty>
          )}
        </Card>
      </Spin>
    </div>
  );
}
