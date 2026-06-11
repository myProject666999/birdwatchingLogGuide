import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, DatePicker, Button, Row, Col, Radio, message, Spin, Alert, Upload } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { speciesApi, observationApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const behaviors = ['取食', '求偶', '筑巢', '育雏', '迁徙', '休息', '鸣叫', '其他'];
const weathers = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '小雪', '中雪', '大雪', '雾', '霾', '其他'];

export default function AddObservation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(false);

  useEffect(() => {
    if (location.state?.speciesId) {
      loadSpeciesDetail(location.state.speciesId);
    }
    form.setFieldsValue({
      observation_date: dayjs(),
      count: 1,
      behavior: '其他',
      is_public: true,
    });
  }, []);

  const loadSpeciesDetail = async (id) => {
    try {
      const res = await speciesApi.getById(id);
      form.setFieldsValue({
        species_id: res.species.id,
      });
      setSpeciesOptions([{
        value: res.species.id,
        label: `${res.species.chinese_name} (${res.species.latin_name})`,
      }]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSpecies = async (value) => {
    if (!value || value.length < 1) return;
    setLoadingSpecies(true);
    try {
      const res = await speciesApi.getList({ keyword: value, pageSize: 20 });
      setSpeciesOptions(res.list.map(s => ({
        value: s.id,
        label: `${s.chinese_name} (${s.latin_name})`,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSpecies(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        observation_date: values.observation_date.format('YYYY-MM-DD'),
      };
      const res = await observationApi.add(payload);

      const msgs = [res.message || '记录成功'];
      if (res.isNewSpecies) {
        msgs.push('🎉 新鸟种！已添加到个人鸟单');
      }
      if (res.newAchievements?.length > 0) {
        msgs.push(`🏆 解锁成就: ${res.newAchievements.map(a => a.name).join('、')}`);
      }
      message.success(msgs.join(' | '));

      setTimeout(() => navigate('/observations'), 1500);
    } catch (err) {
      message.error(err.error || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

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

      <Card title="添加观察记录" style={{ maxWidth: 900 }}>
        <Alert
          message="提示"
          description="每遇到一个没见过的鸟种，会自动添加到个人鸟单并检查成就解锁。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item
                name="species_id"
                label="鸟种"
                rules={[{ required: true, message: '请选择或搜索鸟种' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索鸟种中文名、拉丁名..."
                  defaultActiveFirstOption={false}
                  showArrow={false}
                  filterOption={false}
                  onSearch={handleSearchSpecies}
                  notFoundContent={loadingSpecies ? <Spin size="small" /> : null}
                  options={speciesOptions}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="observation_date"
                label="观察日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="location_name"
                label="地点名称"
                rules={[{ required: true, message: '请输入地点名称' }]}
                extra="例如：北京奥林匹克森林公园、上海世纪公园"
              >
                <Input
                  size="large"
                  prefix={<EnvironmentOutlined />}
                  placeholder="输入观鸟地点"
                />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="province" label="省份">
                <Input size="large" placeholder="如：北京市" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="city" label="城市">
                <Input size="large" placeholder="如：北京市" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={12} sm={6}>
              <Form.Item
                name="count"
                label="数量（只）"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber min={1} size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="behavior" label="行为">
                <Select size="large" options={behaviors.map(b => ({ value: b, label: b }))} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="weather" label="天气">
                <Select size="large" allowClear options={weathers.map(w => ({ value: w, label: w }))} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="is_public" label="公开">
                <Radio.Group size="large">
                  <Radio value={true}>公开</Radio>
                  <Radio value={false}>私有</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={12} md={6}>
              <Form.Item name="latitude" label="纬度">
                <Input size="large" placeholder="如：39.992" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="longitude" label="经度">
                <Input size="large" placeholder="如：116.395" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="district" label="区/县">
                <Input size="large" placeholder="如：朝阳区" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea rows={4} placeholder="记录观察细节：羽色、鸣唱、栖息环境、与其他鸟的互动等..." />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              style={{ width: 200 }}
            >
              保存记录
            </Button>
            <Button
              size="large"
              onClick={() => navigate(-1)}
              style={{ marginLeft: 16 }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
