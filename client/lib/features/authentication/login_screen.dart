import 'package:flutter/material.dart';
import 'package:poc_flutter_client/features/authentication/providers/user_provider.dart';
import 'package:provider/provider.dart';
import 'totp_modal.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.title});

  final String title;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _name = '';
  String _password = '';
  String? _totp;
  String? _errorMessage;

  bool _totpRequired = false;
  bool _loggingIn = false;

  Future<void> handleLogin() async {
    // reset state but don't rebuild the widget
    _totpRequired = false;

    setState(() {
      _loggingIn = true;
      _errorMessage = '';
    });

    if (_name.trim() == '' || _password.trim() == '') {
      setState(() {
        _errorMessage = 'Please fill in all fields';
      });
      return;
    }

    final loginResult = await Provider.of<UserProvider>(context, listen: false)
        .login(_name, _password, _totp);

    switch (loginResult) {
      case TOTPRequiredError():
        setState(() => _totpRequired = true);
      case InvalidCredentialsError():
        setState(() => _errorMessage = 'Your credentials are invalid');
      case AuthenticationError():
        // TODO handle/log error
        print(loginResult.message);
        setState(() => _errorMessage = 'An unexpected error occurred');
      default:
        break;
    }

    setState(() => _loggingIn = false);
    if (_errorMessage != null && _errorMessage!.isNotEmpty && mounted) {
      final errorSnackBar = SnackBar(
          content: Text('Login failed: $_errorMessage'),
          action: SnackBarAction(
              label: 'Dismiss',
              onPressed: ScaffoldMessenger.of(context).hideCurrentSnackBar));
      ScaffoldMessenger.of(context).showSnackBar(errorSnackBar);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
        bottom: _loggingIn
            ? const PreferredSize(
                preferredSize: Size.fromHeight(4.0),
                child: LinearProgressIndicator())
            : null,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.only(left: 80.0, right: 80.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              TextField(
                  style: Theme.of(context).textTheme.bodyMedium,
                  decoration: const InputDecoration(labelText: 'Name'),
                  onChanged: (value) => _name = value),
              TextField(
                style: Theme.of(context).textTheme.bodyMedium,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                onChanged: (value) => _password = value,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                  child: const Text('Login'),
                  onPressed: () async {
                    await handleLogin();
                    if (_totpRequired) {
                      if (!context.mounted) return;
                      showModalBottomSheet(
                          context: context,
                          builder: (BuildContext context) {
                            return TOTPModal(onHandleTotp: (totp) async {
                              _loggingIn = true;
                              bool authenticationSucceeded = false;
                              final loginResult =
                                  await Provider.of<UserProvider>(context,
                                          listen: false)
                                      .login(_name, _password, totp);
                              switch (loginResult) {
                                case AuthenticationSuccess():
                                  authenticationSucceeded = true;
                                case TOTPInvalidError():
                                  authenticationSucceeded = false;
                                case AuthenticationError():
                                  print(loginResult.message);
                                  authenticationSucceeded = false;
                              }
                              _loggingIn = false;
                              return authenticationSucceeded;
                            });
                          });
                    }
                  }),
            ],
          ),
        ),
      ),
    );
  }
}
