import React, { useState } from 'react';
import { 
  Button, 
  Form, 
  Input, 
  Card, 
  Typography,
  message 
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../api/api';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const response = await login(values);
      if (response.data.success) {
        message.success('Login successful');
        // Redirect to gallery page
        window.location.href = '/';
      } else {
        message.error(response.data.error || 'Login failed');
      }
    } catch (error) {
      message.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>Waterfall Gallery</Title>
          <Typography.Text type="secondary">Sign in to continue</Typography.Text>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ username: 'admin', password: 'password' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input 
              prefix={<LockOutlined />} 
              type="password" 
              placeholder="Password" 
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              block
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;