import { useEffect, useState } from 'react';
import { Card, Button, Tag, Avatar, Spin, Empty, message, Modal, Divider, Descriptions, List } from 'antd';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftOutlined, TeamOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { activityApi } from '../api';
import dayjs from 'dayjs';

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

export default function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await activityApi.getById(id);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const res = await activityApi.join(id);
      message.success(res.message || '报名成功');
      if (res.newAchievements?.length > 0) {
        message.success(`🏆 解锁成就: ${res.newAchievements.map(a => a.name).join('、')}`);
      }
      loadData();
    } catch (err) {
      message.error(err.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuit = () => {
    Modal.confirm({
      title: '确认退出活动？',
      onOk: async () => {
        try {
          await activityApi.quit(id);
          message.success('已退出活动');
          loadData();
        } catch (err) {
          message.error(err.error || '操作失败');
        }
      },
    });
  };

  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消活动？',
      content: '取消后将无法恢复，已报名的用户会收到通知',
      okType: 'danger',
      onOk: async () => {
        try {
          await activityApi.cancel(id);
          message.success('活动已取消');
          loadData();
        } catch (err) {
          message.error(err.error || '操作失败');
        }
      },
    });
  };

  if (loading) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!data?.activity) {
    return (
      <div className="page-container">
        <Empty description="活动不存在或已删除">
          <Link to="/activities"><Button type="primary">返回活动列表</Button></Link>
        </Empty>
      </div>
    );
  }

  const activity = data.activity;
  const participants = data.participants || [];
  const isOrganizer = participants.some(p => p.role === '组织者' && p.user_id === (data.currentUserId || 0));
  const isJoined = data.is_joined;
  const isFull = participants.length >= activity.max_participants;

  return (
    <div className="page-container">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        返回
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h1 style={{ marginBottom: 8 }}>{activity.title}</h1>
            <div style={{ marginBottom: 12 }}>
              <Tag color={statusColors[activity.status]} style={{ marginRight: 8, fontSize: 14, padding: '4px 12px' }}>
                {activity.status}
              </Tag>
              <Tag color={difficultyColors[activity.difficulty]} style={{ fontSize: 14, padding: '4px 12px' }}>
                {activity.difficulty}
              </Tag>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                <TeamOutlined /> {participants.length}/{activity.max_participants} 人
              </Tag>
            </div>
          </div>
          <div>
            {activity.status === '招募中' && (
              isJoined ? (
                <Button danger size="large" onClick={handleQuit}>退出活动</Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  disabled={isFull}
                  loading={actionLoading}
                  onClick={handleJoin}
                >
                  {isFull ? '人数已满' : '立即报名'}
                </Button>
              )
            )}
            {isOrganizer && activity.status === '招募中' && (
              <Button danger size="large" style={{ marginLeft: 12 }} onClick={handleCancel}>
                取消活动
              </Button>
            )}
          </div>
        </div>

        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="活动日期">
            <CalendarOutlined /> {dayjs(activity.activity_date).format('YYYY年MM月DD日')}
          </Descriptions.Item>
          <Descriptions.Item label="活动时间">
            {activity.start_time || '待定'} - {activity.end_time || '待定'}
          </Descriptions.Item>
          <Descriptions.Item label="集合地点" span={2}>
            <EnvironmentOutlined /> {activity.location_name}
            {(activity.province || activity.city) && (
              <span style={{ color: '#8c8c8c', marginLeft: 12 }}>
                ({activity.province || ''} {activity.city || ''})
              </span>
            )}
          </Descriptions.Item>
          {activity.equipment && (
            <Descriptions.Item label="建议装备" span={2}>🎒 {activity.equipment}</Descriptions.Item>
          )}
          <Descriptions.Item label="组织者">
            <Avatar
              size="small"
              style={{ backgroundColor: '#667eea', marginRight: 8 }}
              src={activity.organizer_avatar}
            >
              {activity.organizer_name?.[0]}
            </Avatar>
            {activity.organizer_name}
          </Descriptions.Item>
          <Descriptions.Item label="人数上限">{activity.max_participants} 人</Descriptions.Item>
        </Descriptions>
      </Card>

      <Divider />

      {activity.description && (
        <Card title="活动介绍" style={{ marginBottom: 16 }}>
          <p style={{ lineHeight: 2, whiteSpace: 'pre-wrap', fontSize: 15 }}>{activity.description}</p>
        </Card>
      )}

      {activity.notes && (
        <Card title="注意事项" type="inner" style={{ marginBottom: 16 }}>
          <p style={{ lineHeight: 2, whiteSpace: 'pre-wrap', color: '#d4380d' }}>{activity.notes}</p>
        </Card>
      )}

      <Card title={<span><TeamOutlined /> 已报名参与者 ({participants.length}/{activity.max_participants})</span>}>
        {participants.length > 0 ? (
          <List
            dataSource={participants}
            renderItem={p => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={40}
                      style={{ backgroundColor: p.role === '组织者' ? '#faad14' : '#667eea' }}
                      src={p.avatar}
                    >
                      {p.nickname?.[0]}
                    </Avatar>
                  }
                  title={
                    <span>
                      {p.nickname}
                      {p.role === '组织者' && <Tag color="gold" style={{ marginLeft: 8 }}>组织者</Tag>}
                    </span>
                  }
                  description={
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      报名时间：{dayjs(p.joined_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  }
                />
                <Tag color={p.status === '已确认' ? 'green' : 'default'}>{p.status}</Tag>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无参与者" />
        )}
      </Card>
    </div>
  );
}
