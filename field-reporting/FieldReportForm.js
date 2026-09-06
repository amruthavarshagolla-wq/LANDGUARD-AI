// FieldReportForm.js
//
// FIELD REPORTING MODULE — SIH26001 LandGuard AI
// Owner: Field Reporting & Alert Systems Engineer
//
// This is a single self-contained component. It collects a hazard report
// (type, description, severity, GPS location, optional photo) and builds
// the exact JSON/FormData payload the backend's POST /api/field-reports
// endpoint expects.
//
// IMPORTANT FOR INTEGRATION TEAMMATE:
// This component does NOT call any API itself and does NOT hard-code any
// backend URL. Instead, it accepts a prop called `onSubmitReport`, which is
// a function YOU (or the backend teammate) provide from the parent screen.
// See the bottom of this file for exactly what that function receives.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// ---- Fixed option lists (matches backend's expected values exactly) ----
const HAZARD_TYPES = ['CRACK', 'ROCKFALL', 'DEBRIS', 'ROAD_BLOCKAGE', 'LANDSLIDE', 'OTHER'];
const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function FieldReportForm({ onSubmitReport }) {
  // ---- Form state ----
  const [reportType, setReportType] = useState(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);

  // ---- GPS state ----
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // ---- GPS: "Get My Location" button handler ----
  async function handleGetLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      // Ask for permission first — required by both Android and iOS.
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Permission denied — show a clear, real error. We never fake coordinates.
        setLocationError('Location permission denied. Please enable it in Settings to capture GPS.');
        setLocating(false);
        return;
      }

      // Get the REAL current device position (no mock/fake data).
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch (err) {
      // Covers GPS off, timeout, or any other device-level error.
      setLocationError('Could not get GPS location. Make sure location services are turned on and try again.');
    } finally {
      setLocating(false);
    }
  }

  // ---- Photo: capture or pick an optional photo ----
  async function handlePickPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to attach a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6, // keep file size reasonable for slow networks
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  // ---- Validation ----
  function validate() {
    if (!reportType) {
      Alert.alert('Missing field', 'Please select a hazard type.');
      return false;
    }
    if (!description || description.trim().length === 0) {
      Alert.alert('Missing field', 'Please enter a description.');
      return false;
    }
    if (!severity) {
      Alert.alert('Missing field', 'Please select a severity level.');
      return false;
    }
    if (latitude === null || longitude === null) {
      Alert.alert('Missing location', 'Please tap "Get My Location" before submitting.');
      return false;
    }
    return true;
  }

  // ---- Submit ----
  async function handleSubmit() {
    if (!validate()) return;

    // This is the exact payload structure requested for this module.
    // (photo is the local file URI here; see note below on multipart handling)
    const reportData = {
      report_type: reportType,
      description: description.trim(),
      latitude: latitude,
      longitude: longitude,
      severity: severity,
      photo: photoUri, // null if no photo was taken
    };

    if (!onSubmitReport) {
      // Safety check for beginners testing this file on its own.
      Alert.alert('Not connected', 'onSubmitReport function was not provided to this component.');
      console.log('Report data ready to send:', reportData);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitReport(reportData);
      Alert.alert('Success', 'Report submitted.');
      // Reset form after successful submit
      setReportType(null);
      setDescription('');
      setSeverity(null);
      setPhotoUri(null);
      setLatitude(null);
      setLongitude(null);
    } catch (err) {
      Alert.alert('Submission failed', err.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Field Hazard Report</Text>

      {/* Hazard type selector */}
      <Text style={styles.label}>Hazard Type *</Text>
      <View style={styles.chipRow}>
        {HAZARD_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, reportType === type && styles.chipActive]}
            onPress={() => setReportType(type)}
          >
            <Text style={reportType === type ? styles.chipTextActive : styles.chipText}>
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={styles.textArea}
        multiline
        placeholder="Describe what you observed..."
        value={description}
        onChangeText={setDescription}
      />

      {/* Severity selector */}
      <Text style={styles.label}>Severity *</Text>
      <View style={styles.chipRow}>
        {SEVERITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.chip, severity === level && styles.chipActive]}
            onPress={() => setSeverity(level)}
          >
            <Text style={severity === level ? styles.chipTextActive : styles.chipText}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* GPS location */}
      <Text style={styles.label}>Location *</Text>
      <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation} disabled={locating}>
        {locating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.locationButtonText}>📍 Get My Location</Text>
        )}
      </TouchableOpacity>

      {latitude !== null && longitude !== null && (
        <Text style={styles.locationText}>
          Latitude: {latitude.toFixed(6)}   Longitude: {longitude.toFixed(6)}
        </Text>
      )}
      {locationError && <Text style={styles.errorText}>{locationError}</Text>}

      {/* Optional photo */}
      <Text style={styles.label}>Photo (optional)</Text>
      <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
        <Text style={styles.photoButtonText}>
          {photoUri ? 'Retake Photo' : 'Capture Photo'}
        </Text>
      </TouchableOpacity>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#f5f5f5' },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: '700', marginTop: 14, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  chipText: { color: '#333', fontSize: 13 },
  chipTextActive: { color: '#fff', fontSize: 13, fontWeight: '700' },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationButton: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: { color: '#fff', fontWeight: '700' },
  locationText: { marginTop: 8, color: '#333' },
  errorText: { marginTop: 8, color: '#c0392b' },
  photoButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  photoButtonText: { fontWeight: '600', color: '#333' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginTop: 10 },
  submitButton: {
    backgroundColor: '#c0392b',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

/*
 ============================================================
 NOTES FOR YOUR BACKEND / INTEGRATION TEAMMATE
 ============================================================

 This component takes ONE prop: `onSubmitReport`.

 Usage example (in whatever screen renders this form):

   import FieldReportForm from './FieldReportForm';
   import axios from 'axios';

   function ReportScreen() {
     async function handleSubmitReport(reportData) {
       // reportData looks like:
       // {
       //   report_type: "ROCKFALL",
       //   description: "Large rock fell near km 12 marker",
       //   latitude: 20.123456,
       //   longitude: 85.456789,
       //   severity: "HIGH",
       //   photo: "file:///.../photo123.jpg"  // or null
       // }

       const formData = new FormData();
       formData.append('report_type', reportData.report_type);
       formData.append('description', reportData.description);
       formData.append('latitude', String(reportData.latitude));
       formData.append('longitude', String(reportData.longitude));
       formData.append('severity', reportData.severity);

       if (reportData.photo) {
         formData.append('photo', {
           uri: reportData.photo,
           name: 'report.jpg',
           type: 'image/jpeg',
         });
       }

       await axios.post('<YOUR_BACKEND_URL>/api/field-reports', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
       });
     }

     return <FieldReportForm onSubmitReport={handleSubmitReport} />;
   }

 Why it's built this way:
 - This form file has NO knowledge of the backend URL or axios/fetch calls.
 - Your backend teammate plugs in the actual POST request to
   POST /api/field-reports from the parent screen, using their own base URL
   (e.g. from an environment/config file).
 - `reportData.photo` is just a local file URI string from the device.
   It must be converted into multipart form-data (as shown above) before
   sending, because the backend expects `photo` as a file upload, not a
   plain string.
*/
