import { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Empty, Spin, Progress, Statistic, Divider } from 'antd';
import { TrophyOutlined, LockOutlined } from '@ant-design/icons';
import { achievementApi } from '../api';
import dayjs from 'dayjs';

export default function Achievements() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ achievements: [], progress: {} });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await achievementApi.getList();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = data.achievements.filter(a => a.unlocked).length;
  const totalCount = data.achievements.length;
  const progressPercent = totalCount > 0 ? Math.round(unlockedCount / totalCount * 100) : 0;

  const progress = data.progress || {};

  const getAchievementProgress = (ach) => {
    const current = progress[ach.condition_type] || 0;
    const target = ach.condition_value;
    return {
      current,
      target,
      percent: Math.min(100, Math.round(current / target * 100)),
    };
  };

  const progressItems = [
    { label: '总鸟种', key: 'total_species', icon: '🐦' },
    { label: '总观察', key: 'total_observations', icon: '📝' },
    { label: '今年新鸟', key: 'year_new_species', icon: '🎯' },
    { label: '城市数', key: 'unique_cities', icon: '🗺️' },
    { label: '参加活动', key: 'joined_activities', icon: '👥' },
    { label: '发起活动', key: 'organized_activities', icon: '📢' },
  ];

  const typeLabels = {
    milestone: { label: '里程碑', color: 'blue' },
    species: { label: '鸟种', color: 'green' },
    location: { label: '探索', color: 'purple' },
    activity: { label: '活动', color: 'orange' },
    special: { label: '特殊', color: 'red' },
  };

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={14}>
            <Card bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Row align="middle" gutter={24}>
                <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 80 }}>🏆</div>
                </Col>
                <Col xs={24} sm={16}>
                  <h2 style={{ color: 'white', marginBottom: 8 }}>成就系统</h2>
                  <div style={{ opacity: 0.9, marginBottom: 16 }}>
                    记录观鸟，解锁专属成就徽章！
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 36, fontWeight: 700 }}>
                        {unlockedCount} <span style={{ fontSize: 18, opacity: 0.7 }}>/{totalCount}</span>
                      </div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>已解锁成就</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Progress percent={progressPercent} strokeColor={{ '0%': '#ffd666', '100%': '#ffa940' }} size="large" />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="📊 统计数据" size="small">
              <Row gutter={[12, 12]}>
                {progressItems.map(p => (
                  <Col xs={12} sm={8} key={p.key}>
                    <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 24 }}>{p.icon}</div>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{p.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>{progress[p.key] || 0}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>

        <Card title="🎖️ 全部成就">
          {data.achievements.length > 0 ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
              dataSource={data.achievements}
              renderItem={ach => {
                const achProgress = getAchievementProgress(ach);
                const typeInfo = typeLabels[ach.type] || { label: ach.type, color: 'default' };

                return (
                  <List.Item>
                    <Card
                      bordered={!ach.unlocked}
                      style={{
                        opacity: ach.unlocked ? 1 : 0.7,
                        background: ach.unlocked
                          ? 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)'
                          : '#fafafa',
                        border: ach.unlocked ? '1px solid #ffe58f' : '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{
                          width: 80, height: 80,
                          margin: '0 auto 12px',
                          borderRadius: '50%',
                          background: ach.unlocked
                            ? 'linear-gradient(135deg, #ffd666 0%, #ffa940 100%)'
                            : '#e8e8e8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 40,
                          boxShadow: ach.unlocked ? '0 4px 12px rgba(255, 169, 64, 0.3)' : 'none',
                        }}>
                          {ach.unlocked ? ach.icon : <LockOutlined style={{ color: '#bfbfbf', fontSize: 28 }} />}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                          {ach.name}
                        </div>
                        <Tag color={ach.unlocked ? 'gold' : 'default'} style={{ marginBottom: 8 }}>
                          {typeInfo.label}
                        </Tag>
                        <div style={{ color: ach.unlocked ? '#595959' : '#8c8c8c', fontSize: 12, lineHeight: 1.5, minHeight: 32 }}>
                          {ach.description}
                        </div>
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      {ach.unlocked ? (
                        <div style={{ textAlign: 'center', color: '#d48806', fontSize: 12 }}>
                          ✓ 解锁于 {dayjs(ach.unlocked_at).format('YYYY-MM-DD')}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                            <span>进度</span>
                            <span>{achProgress.current} / {achProgress.target}</span>
                          </div>
                          <Progress percent={achProgress.percent} showInfo={false} size="small" />
                        </div>
                      )}
                    </Card>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="暂无成就数据" />
          )}
        </Card>
      </Spin>
    </div>
  );
}
