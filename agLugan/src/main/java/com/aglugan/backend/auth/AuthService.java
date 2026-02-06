package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.ResultDTO;
import com.aglugan.backend.entity.User;
import com.aglugan.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.aglugan.backend.auth.googleAuth.GoogleTokenVerifier;

@Service
public class AuthService {

    private final GoogleTokenVerifier verifier;
    private final UserService userService;

    @Autowired
    public AuthService(GoogleTokenVerifier verifier, UserService user, UserService userService) {
        this.verifier = verifier;
        this.userService = userService;
    }

    public ResultDTO registerUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

//        Store to database
        User newUser = new User(user.getUser().getId(), user.getUser().getName(), user.getUser().getEmail(), "USER" ,user.getUser().getProfilePicture());
        userService.createUser(newUser);

        return user;
    }

    public ResultDTO loginUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);
    }
}
