import { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, DatePicker, TimePicker, Button, Row, Col, message, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { activityApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const difficulties = ['入门', '轻松', '中等', '挑战', '专业'];

export default function CreateActivity() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        activity_date: values.activity_date.format('YYYY-MM-DD'),
        start_time: values.start_time ? values.start_time.format('HH:mm:ss') : null,
        end_time: values.end_time ? values.end_time.format('HH:mm:ss') : null,
      };
      const res = await activityApi.create(payload);
      message.success(res.message || '活动创建成功');
      if (res.newAchievements?.length > 0) {
        setTimeout(() => {
          message.success(`🏆 解锁成就: ${res.newAchievements.map(a => a.name).join('、')}`);
        }, 1000);
      }
      setTimeout(() => navigate(`/activities`), 1500);
    } catch (err) {
      message.error(err.error || '创建失败');
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
        返回活动列表
      </Button>

      <Card title="发起观鸟活动" style={{ maxWidth: 900 }}>
        <Alert
          message="温馨提示"
          description="发起活动即默认您为活动组织者，请准时参加并负责协调活动事宜。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            activity_date: dayjs().add(7, 'day'),
            difficulty: '轻松',
            max_participants: 15,
          }}
        >
          <Form.Item
            name="title"
            label="活动标题"
            rules={[{ required: true, message: '请输入活动标题' }]}
            extra="好的标题能吸引更多观鸟爱好者"
          >
            <Input size="large" placeholder="如：周末奥森公园观鸟半日游" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="description"
            label="活动介绍"
            rules={[{ required: true, message: '请输入活动介绍' }]}
          >
            <TextArea
              rows={5}
              placeholder="介绍活动内容、路线、亮点、适合人群等..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="activity_date"
                label="活动日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker size="large" style={{ width: '100%' }} disabledDate={d => d && d.isBefore(dayjs().startOf('day'))} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="start_time" label="开始时间">
                <TimePicker size="large" style={{ width: '100%' }} format="HH:mm" placeholder="选择开始时间" />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="end_time" label="结束时间">
                <TimePicker size="large" style={{ width: '100%' }} format="HH:mm" placeholder="选择结束时间" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="location_name"
                label="集合地点"
                rules={[{ required: true, message: '请输入集合地点名称' }]}
              >
                <Input
                  size="large"
                  prefix={<EnvironmentOutlined />}
                  placeholder="如：北京奥林匹克森林公园南门"
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
            <Col xs={12} md={6}>
              <Form.Item name="latitude" label="纬度">
                <Input size="large" placeholder="如：40.000" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="longitude" label="经度">
                <Input size="large" placeholder="如：116.390" />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="max_participants"
                label={<span><TeamOutlined /> 活动人数</span>}
                rules={[{ required: true, message: '请输入人数上限' }]}
              >
                <InputNumber size="large" min={2} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="difficulty" label="难度等级">
                <Select size="large" options={difficulties.map(d => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="equipment" label="建议装备">
            <Input
              size="large"
              placeholder="如：双筒望远镜、长焦相机、防晒帽、登山鞋、水、 snacks"
            />
          </Form.Item>

          <Form.Item name="notes" label="注意事项">
            <TextArea
              rows={4}
              placeholder="安全须知、费用说明、交通指引、联系方式等..."
              maxLength={500}
              showCount
            />
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
              发布活动
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
