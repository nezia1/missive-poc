import 'package:flutter/material.dart';

class TOTPModal extends StatefulWidget {
  final Future<bool> Function(String) onHandleTotp;

  const TOTPModal({super.key, required this.onHandleTotp});

  @override
  State<TOTPModal> createState() => _TOTPModalState();
}

class _TOTPModalState extends State<TOTPModal> {
  String _totp = '';
  bool _totpInvalid = false;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TextField(
              decoration: const InputDecoration(labelText: 'TOTP'),
              onChanged: (value) => _totp = value),
          ElevatedButton(
              child: const Text('Submit'),
              onPressed: () async {
                // reversing boolean logic to check if it's invalid (because we want to show the error message if it's invalid, not if it's valid)
                final totpInvalid = !await widget.onHandleTotp(_totp);

                setState(() => _totpInvalid = totpInvalid);

                if (mounted && !_totpInvalid) {
                  Navigator.pop(context);
                }
              }),
          if (_totpInvalid) const Text('Invalid TOTP'),
        ],
      ),
    );
  }
}
