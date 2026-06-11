import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Button, Select, Empty, Spin, DatePicker, Space, Avatar, Modal, message, Input } from 'antd';
import { PlusOutlined, TeamOutlined, CalendarOutlined, EnvironmentOutlined, UserOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { activityApi } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const statusColors = {
  '招募中': 'green',
  '已满员': 'orange',
  '进行中': 'blue',
  '已结束': 'default',
  '已取消': 'red',
};

const difficultyColors = {
  '入门': 'green',
  '轻松': 'blue',
  '中等': 'orange',
  '挑战': 'red',
  '专业': 'purple',
};

export default function Activities() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState();
  const [province, setProvince] = useState();
  const [city, setCity] = useState();
  const [dateRange, setDateRange] = useState();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [page, pageSize, status, province, city, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (status) params.status = status;
      if (province) params.province = province;
      if (city) params.city = city;
      if (dateRange?.length === 2) {
        params.date_from = dateRange[0].format('YYYY-MM-DD');
        params.date_to = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await activityApi.getList(params);
      setData(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (id) => {
    try {
      const res = await activityApi.getById(id);
      setSelectedActivity(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async () => {
    if (!selectedActivity?.activity?.id) return;
    setJoinLoading(true);
    try {
      const res = await activityApi.join(selectedActivity.activity.id);
      message.success(res.message || '报名成功');
      if (res.newAchievements?.length > 0) {
        message.success(`🏆 解锁成就: ${res.newAchievements.map(a => a.name).join('、')}`);
      }
      setSelectedActivity(null);
      loadData();
    } catch (err) {
      message.error(err.error || '报名失败');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleQuit = async () => {
    if (!selectedActivity?.activity?.id) return;
    Modal.confirm({
      title: '确认退出活动？',
      onOk: async () => {
        try {
          await activityApi.quit(selectedActivity.activity.id);
          message.success('已退出活动');
          setSelectedActivity(null);
          loadData();
        } catch (err) {
          message.error(err.error || '操作失败');
        }
      },
    });
  };

  const activity = selectedActivity?.activity;
  const participants = selectedActivity?.participants || [];

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="活动状态"
              allowClear
              value={status}
              onChange={v => { setStatus(v); setPage(1); }}
              style={{ width: '100%' }}
              size="large"
              prefix={<FilterOutlined />}
            >
              {['招募中', '已满员', '进行中', '已结束', '已取消'].map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索省份..."
              size="large"
              allowClear
              value={province}
              onChange={e => { setProvince(e.target.value); setPage(1); }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              size="large"
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col xs={24} sm={12} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/activities/create')}
            >
              发起活动
            </Button>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {data.length > 0 ? (
          <List
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: t => `共 ${t} 个活动`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
            dataSource={data}
            renderItem={item => {
              const isFull = item.current_participants >= item.max_participants;
              return (
                <List.Item
                  key={item.id}
                  style={{ padding: 0, border: 'none', marginBottom: 16 }}
                  onClick={() => showDetail(item.id)}
                >
                  <Card
                    hoverable
                    style={{ cursor: 'pointer', width: '100%' }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <Row gutter={[16, 8]} align="middle">
                      <Col xs={24} md={16}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 600, marginRight: 12 }}>{item.title}</span>
                          <Tag color={statusColors[item.status]} style={{ marginRight: 8 }}>{item.status}</Tag>
                          <Tag color={difficultyColors[item.difficulty]}>{item.difficulty}</Tag>
                        </div>
                        <Space wrap size="large" style={{ color: '#595959' }}>
                          <span><CalendarOutlined /> {dayjs(item.activity_date).format('YYYY-MM-DD')}</span>
                          {item.start_time && <span>🕐 {item.start_time} - {item.end_time || '待定'}</span>}
                          <span><EnvironmentOutlined /> {item.location_name}</span>
                          {(item.province || item.city) && <span>📍 {item.province} {item.city}</span>}
                          <span>
                            <Avatar size="small" style={{ backgroundColor: '#667eea', marginRight: 4 }}>
                              {item.organizer_name?.[0]}
                            </Avatar>
                            {item.organizer_name}
                          </span>
                        </Space>
                        {item.description && (
                          <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13, lineHeight: 1.6 }}>
                            {item.description.length > 100 ? item.description.slice(0, 100) + '...' : item.description}
                          </div>
                        )}
                      </Col>
                      <Col xs={24} md={8} style={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <div style={{ marginBottom: 12 }}>
                          <TeamOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                          <span style={{ fontSize: 20, fontWeight: 600, color: '#1677ff', marginLeft: 8 }}>
                            {item.current_participants}
                          </span>
                          <span style={{ color: '#8c8c8c' }}>/{item.max_participants}人</span>
                        </div>
                        <Button
                          type={item.status === '招募中' && !isFull ? 'primary' : 'default'}
                          disabled={item.status !== '招募中' || isFull}
                          onClick={(e) => { e.stopPropagation(); showDetail(item.id); }}
                        >
                          {item.status === '招募中' ? (isFull ? '已满员' : '立即报名') : item.status}
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty
            description="暂无观鸟活动"
            style={{ padding: 80 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/activities/create')}>
              发起第一个观鸟活动
            </Button>
          </Empty>
        )}
      </Spin>

      <Modal
        title={activity?.title}
        open={!!selectedActivity}
        onCancel={() => setSelectedActivity(null)}
        width={640}
        footer={activity && (
          activity.status === '招募中' ? (
            selectedActivity.is_joined ? (
              [
                <Button key="quit" danger onClick={handleQuit}>退出活动</Button>,
                <Button key="close" onClick={() => setSelectedActivity(null)}>关闭</Button>,
              ]
            ) : (
              activity.current_participants >= activity.max_participants ? (
                [
                  <Button key="close" onClick={() => setSelectedActivity(null)}>关闭</Button>,
                ]
              ) : (
                [
                  <Button key="close" onClick={() => setSelectedActivity(null)}>关闭</Button>,
                  <Button key="join" type="primary" loading={joinLoading} onClick={handleJoin}>
                    立即报名
                  </Button>,
                ]
              )
            )
          ) : (
            [<Button key="close" onClick={() => setSelectedActivity(null)}>关闭</Button>]
          )
        )}
      >
        {activity && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Tag color={statusColors[activity.status]} style={{ marginRight: 8 }}>{activity.status}</Tag>
              <Tag color={difficultyColors[activity.difficulty]}>{activity.difficulty}</Tag>
              <Tag color="blue">
                <TeamOutlined /> {participants.length} / {activity.max_participants} 人
              </Tag>
            </div>

            <Card type="inner" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[12, 8]}>
                <Col xs={24} sm={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>活动日期</div>
                  <div style={{ fontWeight: 500 }}><CalendarOutlined /> {dayjs(activity.activity_date).format('YYYY年MM月DD日')}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>活动时间</div>
                  <div style={{ fontWeight: 500 }}>🕐 {activity.start_time || '待定'} - {activity.end_time || '待定'}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>集合地点</div>
                  <div style={{ fontWeight: 500 }}><EnvironmentOutlined /> {activity.location_name}</div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>所在地区</div>
                  <div style={{ fontWeight: 500 }}>📍 {activity.province || ''} {activity.city || ''}</div>
                </Col>
                {activity.equipment && (
                  <Col xs={24}>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>建议装备</div>
                    <div style={{ fontWeight: 500 }}>🎒 {activity.equipment}</div>
                  </Col>
                )}
              </Row>
            </Card>

            {activity.description && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>活动介绍</div>
                <div style={{ lineHeight: 1.8, color: '#595959', padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  {activity.description}
                </div>
              </div>
            )}

            {activity.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>注意事项</div>
                <div style={{ lineHeight: 1.8, color: '#d4380d', padding: 12, background: '#fff2e8', borderRadius: 6 }}>
                  {activity.notes}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>
                已报名 ({participants.length}/{activity.max_participants})
              </div>
              {participants.length > 0 ? (
                <Avatar.Group
                  maxCount={8}
                  size={40}
                  maxStyle={{
                    color: '#f56a00',
                    backgroundColor: '#fde3cf',
                  }}
                >
                  {participants.map((p, i) => (
                    <Tooltip key={i} title={`${p.nickname}${p.role === '组织者' ? '(组织者)' : ''}`}>
                      <Avatar
                        style={{
                          backgroundColor: p.role === '组织者' ? '#faad14' : '#667eea',
                          verticalAlign: 'middle',
                        }}
                        src={p.avatar}
                      >
                        {p.nickname?.[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </Avatar.Group>
              ) : (
                <div style={{ color: '#8c8c8c' }}>暂无报名</div>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
