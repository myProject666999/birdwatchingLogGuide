import { useState, useEffect } from 'react';
import { Button, Card, Descriptions, Divider, Tag, Breadcrumb, Spin, Row, Col, Empty } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { speciesApi, observationApi } from '../api';
import dayjs from 'dayjs';

const getConservationColor = (status) => {
  if (!status) return 'default';
  if (status.includes('一级')) return 'red';
  if (status.includes('二级')) return 'orange';
  return 'green';
};

export default function SpeciesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState(null);
  const [myObservations, setMyObservations] = useState([]);
  const [hasObserved, setHasObserved] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [speciesData, obsData] = await Promise.all([
        speciesApi.getById(id),
        observationApi.getList({ species_id: id, page: 1, pageSize: 10 }),
      ]);
      setSpecies(speciesData.species);
      setMyObservations(obsData.list || []);
      setHasObserved(obsData.total > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!species) {
    return <div style={{ padding: 100, textAlign: 'center' }}><Empty description="鸟种不存在" /></div>;
  }

  return (
    <div className="page-container">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item><Link to="/species">鸟种图鉴</Link></Breadcrumb.Item>
        <Breadcrumb.Item>{species.chinese_name}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0 }}>
                  返回
                </Button>
                <h1 style={{ margin: '8px 0' }}>
                  {species.chinese_name}
                  {hasObserved && <Tag color="success" style={{ marginLeft: 12 }}>✓ 已记录</Tag>}
                </h1>
                <div style={{ color: '#8c8c8c', fontSize: 16, fontStyle: 'italic' }}>
                  {species.latin_name}
                </div>
                {species.english_name && <div style={{ color: '#8c8c8c' }}>{species.english_name}</div>}
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/observations/add', { state: { speciesId: id } })}>
                记录观察
              </Button>
            </div>

            <div style={{
              height: 280,
              background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f3ff 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 120,
              marginBottom: 24,
            }}>
              🐦
            </div>

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="目" span={1}>
                <Tag color="blue">{species.bird_order}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="科" span={1}>
                <Tag color="purple">{species.family}</Tag>
              </Descriptions.Item>
              {species.genus && <Descriptions.Item label="属">{species.genus}</Descriptions.Item>}
              {species.conservation_status && (
                <Descriptions.Item label="保护级别">
                  <Tag color={getConservationColor(species.conservation_status)}>{species.conservation_status}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">特征描述</Divider>
            <p style={{ lineHeight: 2, fontSize: 15 }}>{species.features || '暂无描述'}</p>

            <Divider orientation="left">分布范围</Divider>
            <p style={{ lineHeight: 2, fontSize: 15 }}>{species.distribution || '暂无信息'}</p>

            {species.habitat && (
              <>
                <Divider orientation="left">栖息环境</Divider>
                <p style={{ lineHeight: 2, fontSize: 15 }}>{species.habitat}</p>
              </>
            )}

            {species.bird_call_audio && (
              <>
                <Divider orientation="left">鸣声</Divider>
                <audio controls src={species.bird_call_audio} style={{ width: '100%' }} />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="我的观察记录" extra={<Tag color="blue">{myObservations.length}条</Tag>}>
            {myObservations.length > 0 ? (
              <>
                {myObservations.map(obs => (
                  <div key={obs.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 500 }}>
                      <Tag color="geekblue">{obs.count}只</Tag>
                      <Tag>{obs.behavior}</Tag>
                    </div>
                    <div style={{ color: '#595959', marginTop: 4, fontSize: 13 }}>
                      📍 {obs.location_name}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>
                      📅 {dayjs(obs.observation_date).format('YYYY-MM-DD')}
                    </div>
                    {obs.notes && (
                      <div style={{ color: '#595959', fontSize: 13, marginTop: 4 }}>{obs.notes}</div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <Empty description="还没有记录过这种鸟" style={{ padding: '40px 0' }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
