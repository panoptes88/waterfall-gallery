import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Upload, 
  message, 
  Image, 
  Popconfirm, 
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Flex
} from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { getPhotos, uploadPhoto, updatePhoto, deletePhoto } from '../api/api';

const { Title } = Typography;

const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await getPhotos();
      setPhotos(response.data);
    } catch (error) {
      message.error('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (values) => {
    const formData = new FormData();
    formData.append('photo', values.photo?.file);
    formData.append('title', values.title);

    try {
      await uploadPhoto(formData);
      message.success('Photo uploaded successfully');
      setUploadModalVisible(false);
      form.resetFields();
      fetchPhotos();
    } catch (error) {
      message.error('Failed to upload photo');
    }
  };

  const handleUpdate = async (values) => {
    try {
      await updatePhoto(currentPhoto.id, { title: values.title });
      message.success('Photo updated successfully');
      setEditModalVisible(false);
      form.resetFields();
      fetchPhotos();
    } catch (error) {
      message.error('Failed to update photo');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePhoto(id);
      message.success('Photo deleted successfully');
      fetchPhotos();
    } catch (error) {
      message.error('Failed to delete photo');
    }
  };

  const showEditModal = (photo) => {
    setCurrentPhoto(photo);
    form.setFieldsValue({ title: photo.title });
    setEditModalVisible(true);
  };

  const uploadProps = {
    name: 'photo',
    maxCount: 1,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('Image must be smaller than 10MB!');
      }
      return isImage && isLt10M;
    },
  };

  return (
    <div className="gallery-container">
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Title level={2}>Waterfall Gallery</Title>
        <Button 
          type="primary" 
          icon={<UploadOutlined />}
          onClick={() => setUploadModalVisible(true)}
        >
          Upload Photo
        </Button>
      </Flex>

      <Row gutter={[16, 16]}>
        {photos.map((photo) => (
          <Col key={photo.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              cover={
                <Image
                  src={`/uploads/${photo.filename}`}
                  alt={photo.title}
                  style={{ height: 200, objectFit: 'cover' }}
                  preview={{ mask: <div>{photo.title}</div> }}
                />
              }
              actions={[
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => showEditModal(photo)}
                />,
                <Popconfirm
                  title="Are you sure you want to delete this photo?"
                  onConfirm={() => handleDelete(photo.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}></Button>
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={photo.title || 'Untitled'}
                description={`Size: ${(photo.fileSize / 1024).toFixed(2)} KB`}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Upload Modal */}
      <Modal
        title="Upload Photo"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        className="upload-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="title"
            label="Title"
          >
            <Input placeholder="Enter photo title" />
          </Form.Item>
          
          <Form.Item
            name="photo"
            label="Photo"
            valuePropName="file"
            getValueFromEvent={(e) => e}
            rules={[{ required: true, message: 'Please upload a photo!' }]}
          >
            <Upload {...uploadProps} accept="image/*">
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
              >
                Upload
              </Button>
              <Button 
                onClick={() => {
                  setUploadModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Photo"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title!' }]}
          >
            <Input placeholder="Enter photo title" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
              >
                Update
              </Button>
              <Button 
                onClick={() => {
                  setEditModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GalleryPage;